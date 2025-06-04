import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UserListComponent } from '../user-list/user-list.component';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chat-call-interface',
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    UserListComponent,
    MatDialogModule,
    UserListComponent]
  ,
  templateUrl: './chat-call-interface.component.html',
  styleUrl: './chat-call-interface.component.css'
})
export class ChatCallInterfaceComponent {

}
