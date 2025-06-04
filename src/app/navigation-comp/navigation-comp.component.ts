import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthServiceService } from '../auth-service.service';
@Component({
  selector: 'app-navigation-comp',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './navigation-comp.component.html',
  styleUrl: './navigation-comp.component.css'
})
export class NavigationComponent {

  constructor(private route: Router,private auth:AuthServiceService) { }
  showCanvas :boolean = false;

  logOut(){
    this.auth.logout().subscribe((res)=>{
      this.route.navigate(['login'])
      localStorage.removeItem('user')
    })
  }
}
