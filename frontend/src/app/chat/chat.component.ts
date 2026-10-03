import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { AiAssistantService } from '../services/ai-assistant.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'ai';
}

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
    imports: [CommonModule, FormsModule, MarkdownModule]
})
export class ChatComponent implements AfterViewChecked {
  userMessage: string = '';
  messages: ChatMessage[] = [];
  isLoading: boolean = false;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor(private aiService: AiAssistantService) {
    this.messages.push({
      text: "Hello! I can help you with your code. For example, ask me to 'write a TypeScript function to sort an array'.",
      sender: 'ai',
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  onEnter(event: any): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isLoading) { return; }

    this.messages.push({ text: this.userMessage, sender: 'user' });
    const messageToSend = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    const textarea = document.querySelector('.chat-textarea') as HTMLTextAreaElement;
    if (textarea) { textarea.style.height = 'auto'; }

    this.aiService.sendMessage(messageToSend).subscribe({
      next: (response) => {
        this.messages.push({ text: response.reply, sender: 'ai' });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error sending message to AI:', error);
        this.messages.push({
          text: 'Sorry, there was an error processing your request. Please try again.',
          sender: 'ai',
        });
        this.isLoading = false;
      },
    });
  }

  containsCode(text: string): boolean {
    return text.includes('```');
  }

  copyCode(event: MouseEvent, textToCopy: string) {
    const codeRegex = /```(?:\w+\n)?([\s\S]*?)```/;
    const match = codeRegex.exec(textToCopy);
    const code = match ? match[1] : textToCopy;

    navigator.clipboard.writeText(code).then(() => {
      const button = event.target as HTMLElement;
      const originalIcon = button.innerHTML;
      button.innerHTML = `<i class="fas fa-check"></i>`;
      button.classList.add('copied');

      setTimeout(() => {
        button.innerHTML = originalIcon;
        button.classList.remove('copied');
      }, 1500);
    });
  }
}