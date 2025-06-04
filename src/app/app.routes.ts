import { Routes } from '@angular/router';
import { LoginComponent } from './login-comp/login-comp.component';
import { ChatInterfaceComponent } from './chat-interface/chat-interface.component';
import { CallComponent } from './call/call.component';
import { ChatCallInterfaceComponent } from './chat-call-interface/chat-call-interface.component';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'welcome', component: WelcomePageComponent },
  {
    path: 'chat',
    component: ChatCallInterfaceComponent,
    children: [
       { path: ':uid/chat', component: ChatInterfaceComponent },
  { path: ':uid/call', component: CallComponent },
    ]
  },
];

