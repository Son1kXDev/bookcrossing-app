import {Component, OnInit} from '@angular/core';
import {AuthService, UserDto} from '../../auth/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: UserDto | null = null;
  loading = false;
  error = "";

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit() {
    this.loading = true;
    this.error = "";
    try {
      this.user = await this.auth.me();
    } catch {
      this.error = "Сессия истекла. Пожалуйста, войдите снова.";
      this.auth.logout();
      await this.router.navigateByUrl("/login");
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    this.auth.logout();
    await this.router.navigateByUrl("/login");
  }

  roleDisplay(role:string){
    switch(role){
      case 'user': return 'Пользователь';
      case 'admin': return 'Администратор';
      default: return role;
    }
  }
}
