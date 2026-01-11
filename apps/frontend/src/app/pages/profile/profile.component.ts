import {Component, OnInit} from '@angular/core';
import {AuthService, UserDto} from '../../auth/auth.service';
import {Router, RouterLink} from '@angular/router';
import {DatePipe, registerLocaleData} from '@angular/common';
import localeRu from '@angular/common/locales/ru';

registerLocaleData(localeRu);

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: UserDto | null = null;
  loading = false;
  error = "";

  constructor(private auth: AuthService, private router: Router) {}

  //@TODO: отображать информацию о количестве созданных книг и совершенных сделок пользователя
  //@TODO: добавить возможность редактирования профиля
  //@TODO: добавить возможность смены пароля
  //@TODO: добавить возможность удаления аккаунта
  //@TODO: добавить аватар пользователя
  //@TODO: добавить возможность просмотра профилей других пользователей
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
