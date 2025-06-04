import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { CommonModule } from '@angular/common';
import { MatListItem, MatNavList } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  imports: [CommonModule,MatNavList,MatListItem,MatIcon]
})

export class UserListComponent implements OnInit {
  users: any[] = [];
  currentUserId = localStorage.getItem("user") || ''; // replace with actual current user id

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  ngOnInit(): void {
    this.firebaseService.getUsers().subscribe(users => {
      this.users = users.filter(u => u.uid !== this.currentUserId);
    });
  }

  selectUser(user: any) {
    // this.firebaseService.getMessages()
    this.router.navigate(['/chat', user.uid,'chat']);
  }

  startCall(user: any) { 
    this.router.navigate(['/chat', user.uid,'call']);
  }

  openChat(user: any) {
    this.router.navigate(['/chat', user.uid,'chat']);
  }
}
