import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
// import { jwtDecode } from 'jwt-decode';
import { AuthServiceService } from '../auth-service.service';
import { FirebaseService } from '../firebaseservice.service';
@Component({
  selector: 'app-login-comp',
  imports: [ReactiveFormsModule,CommonModule,FormsModule,HttpClientModule],
  templateUrl: './login-comp.component.html',
  styleUrl: './login-comp.component.css',
  providers:[AuthServiceService],
})
export class LoginComponent {
  private userLogedIn:any;
  error:any[] = [];
  constructor(private route:Router,private _dataService:FirebaseService){}

  form = new FormGroup({
    email : new FormControl("",[
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(10),
    ]),
    password : new FormControl("",[
      Validators.required,
      Validators.minLength(3),
    ]),
  })

  log(x:any){
    console.log(x);
  }

  Login(x:any){
      this._dataService.loginWithEmailAndPassword(x.email,x.password).subscribe({next:(response:any)=>{
          this.route.navigate(['chat']);
          if(response){
            const user = response;
            localStorage.setItem("user",user.id);
          }else{
            alert("No user found")
          }
        },
          error:(error:any)=>{  
            this.error = error;
        }
      });
  }

  get user(){
    return this.userLogedIn;
  }

  get email(){
    return this.form.get('email');
  }
  get password(){
    return this.form.get('password');
  }

}
