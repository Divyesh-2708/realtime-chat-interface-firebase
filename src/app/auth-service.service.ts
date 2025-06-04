import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  firebaseAuth = inject(Auth);
  constructor() { }

  register(user: any): Observable<void> {
    const promis = createUserWithEmailAndPassword(this.firebaseAuth, user.email, user.password).
      then((res) => updateProfile(res.user, { displayName: user.userName }))
      .catch((err) => console.log(err));
    return from(promis);
  }

  login(user:any){
    const logedin = signInWithEmailAndPassword(this.firebaseAuth,user.email,user.password)
    return from(logedin);  
  }


  logout() {
    const logedOut = signOut(this.firebaseAuth);
    return from(logedOut);
  }

}
