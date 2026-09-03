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

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabaseService = inject(SupabaseService);
  private supabaseClient!: SupabaseClient;
  
  public messages = signal<ChatMessage[]>([]);
  public onlineUsers = signal<OnlineUser[]>([]);

  // 🎥 Video call state
  public localStream = signal<MediaStream | null>(null);
  public remoteStream = signal<MediaStream | null>(null);
  public isIncomingCall = signal<boolean>(false);
  public isCallActive = signal<boolean>(false);
  public currentCallerName = signal<string>('');

  private roomChannel: any;
  private currentUserName = '';
  private peer: any;
  private activeMediaCall: any;

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
      this.activeMediaCall = call;
      this.currentCallerName.set(call.peer);
      this.isIncomingCall.set(true);
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
      .on('broadcast', { event: 'call-lifecycle' }, (payload: any) => {
        const data = payload.payload;
        if (data.receiver === this.currentUserName && data.action === 'hangup') {
          this.terminateMediaSessionLocally();
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

  // 📞 Outbound: dial a friend's Peer ID directly
  async startOutgoingVideoCall(targetFriendName: string) {
    this.currentCallerName.set(targetFriendName);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      this.isCallActive.set(true);

      this.activeMediaCall = this.peer.call(targetFriendName, stream);
      this.activeMediaCall.on('stream', (remoteMediaStream: MediaStream) => {
        this.remoteStream.set(remoteMediaStream);
      });
    } catch (err) {
      console.error('Failed to capture local camera devices:', err);
      this.isCallActive.set(false);
    }
  }

  // 📞 Inbound: answer a call that's ringing
  async acceptIncomingCall() {
    this.isIncomingCall.set(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.localStream.set(stream);
      this.isCallActive.set(true);

      this.activeMediaCall.answer(stream);
      this.activeMediaCall.on('stream', (remoteMediaStream: MediaStream) => {
        this.remoteStream.set(remoteMediaStream);
      });
    } catch (err) {
      console.error('Could not answer call:', err);
      this.isCallActive.set(false);
    }
  }

  // 📞 Decline an incoming call, or hang up an active one
  rejectOrHangupCall(targetFriendName: string) {
    if (this.roomChannel) {
      this.roomChannel.send({
        type: 'broadcast',
        event: 'call-lifecycle',
        payload: { action: 'hangup', receiver: targetFriendName }
      });
    }
    this.terminateMediaSessionLocally();
  }

  private terminateMediaSessionLocally() {
    this.isIncomingCall.set(false);
    this.isCallActive.set(false);

    this.localStream()?.getTracks().forEach(track => track.stop());
    this.localStream.set(null);
    this.remoteStream.set(null);

    if (this.activeMediaCall) {
      this.activeMediaCall.close();
      this.activeMediaCall = null;
    }
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
    this.terminateMediaSessionLocally();
    if (this.roomChannel) {
      this.supabaseClient.removeChannel(this.roomChannel);
    }
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
