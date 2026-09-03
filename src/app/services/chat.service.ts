import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

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
  
  private roomChannel: any;
  private currentUserName = '';

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
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.roomChannel.track({
            online_at: new Date().toISOString(),
            gender: userGender
          });
        }
      });
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
    if (this.roomChannel) {
      this.supabaseClient.removeChannel(this.roomChannel);
    }
  }
}
