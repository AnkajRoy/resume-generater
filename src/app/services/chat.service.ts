import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import Peer from 'peerjs';

export interface ChatMessage {
  id?: string;
  userName: string;
  text: string;
  timestamp: string;
  receiver: string; // 'global' or a specific target's username
  isSystem?: boolean;
}

export interface OnlineUser {
  userName: string;
  gender: 'male' | 'female' | 'other';
}

const MAX_CALL_PARTICIPANTS = 6;

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabaseService = inject(SupabaseService);
  private supabaseClient!: SupabaseClient;

  public messages = signal<ChatMessage[]>([]);
  public onlineUsers = signal<OnlineUser[]>([]);

  // 🎥 Group-capable video call state (works for 1:1 and up to MAX_CALL_PARTICIPANTS)
  public localStream = signal<MediaStream | null>(null);
  public remoteParticipants = signal<Map<string, MediaStream>>(new Map());
  public isIncomingCall = signal<boolean>(false);
  public isCallActive = signal<boolean>(false);
  public incomingCallFromName = signal<string>('');
  public isMicOn = signal<boolean>(true);
  public isCamOn = signal<boolean>(true);

  private roomChannel: any;
  private currentUserName = '';
  private peer: any;

  private mediaConnections = new Map<string, any>(); // peerId -> active PeerJS MediaConnection
  private activeCallRoom: string | null = null; // 'global-call' or 'dm:<a>|<b>'
  private pendingIncomingCall: any = null;

  constructor() {
    this.extractSupabaseClient();
  }

  private extractSupabaseClient() {
    const values = Object.values(this.supabaseService);
    const clientInstance = values.find(val => val && typeof val === 'object' && 'auth' in val && 'storage' in val);
    this.supabaseClient = clientInstance ? (clientInstance as SupabaseClient) : (this.supabaseService as any).supabase;
  }

  joinChatSystem(userName: string, userGender: 'male' | 'female' | 'other') {
    this.currentUserName = userName;
    this.messages.set([]);

    // PeerJS client, using the nickname as this user's unique calling ID
    this.peer = new Peer(userName);
    this.peer.on('call', (call: any) => {
      const room = call.metadata?.room;

      if (this.isCallActive() && this.activeCallRoom === room) {
        // Already in this exact call room (group call growing) — join the mesh automatically.
        this.answerMediaCall(call);
      } else if (!this.isCallActive()) {
        // A fresh ring — needs explicit accept/decline.
        this.pendingIncomingCall = call;
        this.incomingCallFromName.set(call.peer);
        this.isIncomingCall.set(true);
      } else {
        // Busy in a different call room.
        call.close();
      }
    });

    // Single master sync connection channel
    this.roomChannel = this.supabaseClient.channel('whatsapp-lounge-room', {
      config: { presence: { key: userName } }
    });

    this.roomChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = this.roomChannel.presenceState();
        const usersList: OnlineUser[] = Object.keys(newState)
          .filter(name => name !== this.currentUserName) // Filter out yourself from directory lists
          .map(name => {
            const presencePreservedMetadata = newState[name]?.[0];
            return {
              userName: name,
              gender: presencePreservedMetadata?.gender || 'other'
            };
          });
        this.onlineUsers.set(usersList);
      })
      .on('broadcast', { event: 'private-msg' }, (payload: any) => {
        const msg = payload.payload;
        // Keep logs if directed globally, explicitly to me, or sent by me
        if (msg.receiver === 'global' || msg.receiver === this.currentUserName || msg.userName === this.currentUserName) {
          this.messages.update(list => [...list, msg]);
        }
      })
      .on('broadcast', { event: 'call-room-sync' }, (payload: any) => {
        const { room, action, who } = payload.payload;
        if (who === this.currentUserName) return;
        if (room !== this.activeCallRoom || !this.isCallActive()) return;

        if (action === 'joined') {
          const stream = this.localStream();
          if (stream) this.dialPeer(who, stream, room);
        } else if (action === 'left') {
          this.dropParticipant(who);
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.roomChannel.track({
            online_at: new Date().toISOString(),
            gender: userGender
          });
        }
      });
  }

  private buildRoomId(target: string): string {
    if (target === 'global') return 'global-call';
    return 'dm:' + [this.currentUserName, target].sort().join('|');
  }

  /** Start a 1:1 call, or start/join the shared Global Lounge group call (up to MAX_CALL_PARTICIPANTS). */
  async startOrJoinCall(target: string) {
    const room = this.buildRoomId(target);
    if (this.isCallActive()) return; // already on a call

    if (this.remoteParticipants().size + 1 >= MAX_CALL_PARTICIPANTS) {
      alert(`This call is full (max ${MAX_CALL_PARTICIPANTS} participants).`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      this.isMicOn.set(true);
      this.isCamOn.set(true);
      this.isCallActive.set(true);
      this.activeCallRoom = room;

      if (target !== 'global') {
        this.dialPeer(target, stream, room);
      } else {
        // Announce myself in the shared room — anyone already in it will dial me back.
        this.roomChannel.send({
          type: 'broadcast',
          event: 'call-room-sync',
          payload: { room, action: 'joined', who: this.currentUserName }
        });
      }
    } catch (err) {
      console.error('Failed to capture local camera devices:', err);
      this.isCallActive.set(false);
      this.activeCallRoom = null;
    }
  }

  private dialPeer(targetPeerId: string, stream: MediaStream, room: string) {
    if (this.mediaConnections.has(targetPeerId)) return;
    const call = this.peer.call(targetPeerId, stream, { metadata: { room } });
    this.wireMediaConnection(targetPeerId, call);
  }

  private answerMediaCall(call: any) {
    const stream = this.localStream();
    if (!stream) return;
    call.answer(stream);
    this.wireMediaConnection(call.peer, call);
  }

  private wireMediaConnection(peerId: string, call: any) {
    this.mediaConnections.set(peerId, call);
    call.on('stream', (remoteStream: MediaStream) => {
      this.remoteParticipants.update(map => {
        const next = new Map(map);
        next.set(peerId, remoteStream);
        return next;
      });
    });
    call.on('close', () => this.dropParticipant(peerId));
  }

  private dropParticipant(peerId: string) {
    const conn = this.mediaConnections.get(peerId);
    if (conn) {
      conn.close();
      this.mediaConnections.delete(peerId);
    }
    this.remoteParticipants.update(map => {
      const next = new Map(map);
      next.delete(peerId);
      return next;
    });

    // Nobody left in the call — end it for me too, same as a real call app.
    if (this.isCallActive() && this.remoteParticipants().size === 0) {
      this.leaveCall();
    }
  }

  // 📞 Inbound: answer a ringing 1:1/first call
  async acceptIncomingCall() {
    const call = this.pendingIncomingCall;
    this.isIncomingCall.set(false);
    if (!call) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      this.isMicOn.set(true);
      this.isCamOn.set(true);
      this.isCallActive.set(true);
      this.activeCallRoom = call.metadata?.room || null;

      this.answerMediaCall(call);
      this.pendingIncomingCall = null;
    } catch (err) {
      console.error('Could not answer call:', err);
      this.isCallActive.set(false);
      this.activeCallRoom = null;
    }
  }

  declineIncomingCall() {
    this.pendingIncomingCall?.close();
    this.pendingIncomingCall = null;
    this.isIncomingCall.set(false);
    this.incomingCallFromName.set('');
  }

  // 🎤 / 📷 Mute controls — just flips MediaStreamTrack.enabled, no renegotiation needed.
  toggleMic() {
    const audioTrack = this.localStream()?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    this.isMicOn.set(audioTrack.enabled);
  }

  toggleCam() {
    const videoTrack = this.localStream()?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    this.isCamOn.set(videoTrack.enabled);
  }

  /** Leave the current call (hangs up on everyone I'm connected to). */
  leaveCall() {
    const room = this.activeCallRoom;

    this.mediaConnections.forEach(conn => conn.close());
    this.mediaConnections.clear();
    this.remoteParticipants.set(new Map());

    this.localStream()?.getTracks().forEach(track => track.stop());
    this.localStream.set(null);
    this.isCallActive.set(false);
    this.isMicOn.set(true);
    this.isCamOn.set(true);

    if (room && this.roomChannel) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'call-room-sync',
        payload: { room, action: 'left', who: this.currentUserName }
      });
    }
    this.activeCallRoom = null;
  }

  broadcastMessage(text: string, receiver: string) {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      userName: this.currentUserName,
      text: text,
      receiver: receiver,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.messages.update(list => [...list, newMsg]);

    this.roomChannel.send({
      type: 'broadcast',
      event: 'private-msg',
      payload: newMsg
    });
  }

  disconnect() {
    if (this.isCallActive()) this.leaveCall();
    if (this.roomChannel) {
      this.supabaseClient.removeChannel(this.roomChannel);
    }
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
