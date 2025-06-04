import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { MatFormField } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { CallListenerService } from '../services/call-listener.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat-interface.component.html',
  styleUrls: ['./chat-interface.component.css'],
  imports: [CommonModule, MatFormField, FormsModule, MatIcon, MatInput]
})
export class ChatInterfaceComponent implements OnInit {
  messages: any[] = [];
  newMessage: string = '';
  currentUserId = localStorage.getItem("user") || ''; // Replace with actual user id logic
  otherUserId!: string;

  constructor(private route: ActivatedRoute, private firebaseService: FirebaseService,private callService:CallListenerService) { }

  ngOnInit(): void {
    const userId = localStorage.getItem('currentUserId') || ''; // however you store i // Or however you store it
    this.callService.listenForIncomingCalls(userId);
    this.otherUserId = this.route.snapshot.params['uid'];
    if (!this.otherUserId) return;
    this.firebaseService.getMessages(this.currentUserId, this.otherUserId).subscribe(msgs => {
      this.messages = msgs;
    });
    // this.listenToMessages();
  }

  listenToMessages() {
    if (!this.otherUserId) return;
    this.firebaseService.getMessages(this.currentUserId, this.otherUserId).subscribe(msgs => {
      this.messages = msgs;
    });
  }

  sendMessage() {
    if (this.newMessage.trim() === '') return;

    this.firebaseService.sendMessage(this.currentUserId, this.otherUserId, this.newMessage);
    this.newMessage = '';
  }
}

