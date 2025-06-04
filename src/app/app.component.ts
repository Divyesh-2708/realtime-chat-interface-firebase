import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NavigationComponent } from './navigation-comp/navigation-comp.component';
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserListComponent } from './user-list/user-list.component';
import { IncomingCallDialogComponent } from './incoming-call-dialog/incoming-call-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { CallListenerService } from './services/call-listener.service';
@Component({
  selector: 'app-root',
  imports: [CommonModule,
    NavigationComponent,
    RouterModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    UserListComponent,
    MatDialogModule,
    IncomingCallDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(private callListener: CallListenerService) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('user'); // however you store it
    if (userId) {
      this.callListener.listenForIncomingCalls(userId);
    }
  }
  title = 'reduxDemo';

}
