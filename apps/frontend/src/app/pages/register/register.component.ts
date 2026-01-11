import {Component} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  displayName = "";
  email = "";
  password = "";
  loading = false;
  error = "";

  constructor(private auth: AuthService, private router: Router) {}

  canSubmit() {
    return this.email.trim() !== "" && this.password.trim() !== "" && this.displayName.trim() !== "" && !this.loading;
  }

  async submit() {
    this.error = "";
    this.loading = true;
    try {
      let userInfo = await this.auth.register(this.email, this.password, this.displayName);
      this.auth.saveUserInfo(userInfo);
      await this.router.navigateByUrl("/catalog");
    } catch (e: any) {
      this.error = "Не удалось зарегистрироваться.";
    } finally {
      this.loading = false;
    }
  }
}
