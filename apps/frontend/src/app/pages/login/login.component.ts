import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = "";
  password = "";
  loading = false;
  error = "";

  constructor(private auth: AuthService, private router: Router) {}

  canSubmit() {
    return this.email.trim() !== "" && this.password.trim() !== "" && !this.loading;
  }

  async submit() {
    this.error = "";
    this.loading = true;
    try {
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl("/profile");
    } catch (e: any) {
      this.error = "Ошибка входа. Неправильный email или пароль";
    } finally {
      this.loading = false;
    }
  }
}
