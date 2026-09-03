import { Component, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { SiteHeaderComponent } from '../shared/site-header/site-header.component';

@Component({
  selector: 'app-chat-component',
  standalone: true,
  imports: [CommonModule, FormsModule, SiteHeaderComponent],
  templateUrl: './chat-component.component.html',
  styleUrl: './chat-component.component.css'
})
export class ChatComponentComponent implements OnDestroy, AfterViewChecked {
  public chatService = inject(ChatService); // public so the template can read call-state signals directly
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  // Onboarding registration fields
  inputName = '';
  chosenGender: 'male' | 'female' | 'other' = 'male';
  
  savedUserName = signal<string | null>(null);
  
  // States: 'contacts' (Dashboard Directory view) or 'global' or 'username'
  activeChatTarget = signal<string>('contacts');

  onlineFriends = this.chatService.onlineUsers;

  // Real-time conversation logic filter streams
  filteredMessages = computed(() => {
    const target = this.activeChatTarget();
    const me = this.savedUserName();
    return this.chatService.messages().filter(msg => {
      if (target === 'global') return msg.receiver === 'global';
      return (msg.userName === me && msg.receiver === target) || 
             (msg.userName === target && msg.receiver === me);
    });
  });

  enterChat() {
    const name = this.inputName.trim();
    if (!name) return;
    this.savedUserName.set(name);
    this.chatService.joinChatSystem(name, this.chosenGender);
    this.activeChatTarget.set('contacts'); // Load home profile deck initially
  }

  openChatWith(target: string) {
    this.activeChatTarget.set(target);
  }

  goBackToContacts() {
    this.activeChatTarget.set('contacts');
  }

  typedMessage = '';
  sendMessage() {
    const txt = this.typedMessage.trim();
    if (!txt) return;

    this.chatService.broadcastMessage(txt, this.activeChatTarget());
    this.typedMessage = '';
  }

  initiateVideoCall() {
    this.chatService.startOutgoingVideoCall(this.activeChatTarget());
  }

  acceptCall() {
    this.chatService.acceptIncomingCall();
  }

  declineOrEndCall() {
    this.chatService.rejectOrHangupCall(this.chatService.currentCallerName());
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer && this.activeChatTarget() !== 'contacts') {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }
}
