import {Component, OnInit} from '@angular/core';
import {AuthService, UserDto} from '../../auth/auth.service';
import {Router, RouterLink} from '@angular/router';
import {BooksService} from '../../services/books.service';
import {DealsService} from '../../services/deals.service';
import {BookDto, DealDto} from '../../core/api.types';
import {UsersService} from '../../services/users.service';
import {RuntimeConfigService} from '../../core/runtime-config.service';
import {FormsModule} from '@angular/forms';
import {DatePipe} from '@angular/common';

type ProfileStats = {
  booksTotal: number;
  booksAvailable: number;
  booksReserved: number;
  booksExchanged: number;

  outgoingTotal: number;
  incomingTotal: number;

  actionRequiredTotal: number;
  actionRequiredBuyer: number;
  actionRequiredSeller: number;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  user: UserDto | null = null;
  loading = false;
  error = '';

  editName = "";
  editBusy = false;
  editMsg = "";
  editErr = "";

  passCurrent = "";
  passNew = "";
  passBusy = false;
  passMsg = "";
  passErr = "";

  delPassword = "";
  delBusy = false;
  delErr = "";

  avatarBusy = false;
  avatarErr = "";

  stats: ProfileStats = {
    booksTotal: 0,
    booksAvailable: 0,
    booksReserved: 0,
    booksExchanged: 0,
    outgoingTotal: 0,
    incomingTotal: 0,
    actionRequiredTotal: 0,
    actionRequiredBuyer: 0,
    actionRequiredSeller: 0,
  };

  constructor(
    private auth: AuthService,
    private router: Router,
    private booksApi: BooksService,
    private dealsApi: DealsService,
    private usersApi: UsersService,
    private cfg: RuntimeConfigService
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.error = '';

    try {
      this.user = await this.auth.me();
      const [myBooks, outgoingDeals, incomingDeals, actionReq] = await Promise.all([
        this.booksApi.listMy(),
        this.dealsApi.my(),
        this.dealsApi.incoming(),
        this.dealsApi.actionRequiredCount(),
      ]);

      this.fillStats(myBooks, outgoingDeals, incomingDeals, actionReq);
    } catch {
      this.error = 'Сессия истекла. Пожалуйста, войдите снова.';
      this.auth.logout();
      await this.router.navigateByUrl('/login');
    } finally {
      this.loading = false;
    }

    this.editName = this.user?.displayName ?? "";
  }

  async saveProfile() {
    if (!this.user) return;
    const name = this.editName.trim();
    if (name.length < 2) {
      this.editErr = "Имя должно содержать минимум 2 символа";
      return;
    }

    this.editBusy = true;
    this.editErr = "";
    this.editMsg = "";
    try {
      const updated = await this.usersApi.updateMe({ displayName: name });
      this.user = updated;
      localStorage.setItem("userInfo", JSON.stringify(updated));
      this.editMsg = "Сохранено";
    } catch {
      this.editErr = "Не удалось сохранить профиль";
    } finally {
      this.editBusy = false;
    }
  }

  async onAvatarFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.avatarErr = "Можно загрузить только изображение";
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.avatarErr = "Файл слишком большой (макс. 2 МБ)";
      input.value = "";
      return;
    }

    this.avatarBusy = true;
    this.avatarErr = "";
    try {
      const updated = await this.usersApi.uploadAvatar(file);
      this.user = updated;
      localStorage.setItem("userInfo", JSON.stringify(updated));
    } catch {
      this.avatarErr = "Не удалось загрузить аватар";
    } finally {
      this.avatarBusy = false;
      input.value = "";
    }
  }

  async deleteAvatar() {
    if (!this.user?.avatarUrl) return;
    this.avatarBusy = true;
    this.avatarErr = "";
    try {
      await this.usersApi.deleteAvatar();
      const me = await this.auth.me();
      this.user = me;
      localStorage.setItem("userInfo", JSON.stringify(me));
    } catch {
      this.avatarErr = "Не удалось удалить аватар";
    } finally {
      this.avatarBusy = false;
    }
  }

  coverSrc(coverUrl: string) {
    if (coverUrl.startsWith("http")) return coverUrl;
    return `${this.cfg.apiUrl}${coverUrl}`;
  }

  async changePassword() {
    this.passErr = "";
    this.passMsg = "";
    const cur = this.passCurrent.trim();
    const nw = this.passNew.trim();
    if (cur.length < 6 || nw.length < 6) {
      this.passErr = "Пароли должны быть минимум 6 символов";
      return;
    }
    if (cur === nw) {
      this.passErr = "Новый пароль должен отличаться от текущего";
      return;
    }

    this.passBusy = true;
    try {
      await this.auth.changePassword(cur, nw);
      this.passMsg = "Пароль изменён";
      this.passCurrent = "";
      this.passNew = "";
    } catch {
      this.passErr = "Не удалось изменить пароль";
    } finally {
      this.passBusy = false;
    }
  }

  async deleteAccount() {
    const pwd = this.delPassword.trim();
    if (pwd.length < 6) {
      this.delErr = "Введите пароль";
      return;
    }

    this.delBusy = true;
    this.delErr = "";
    try {
      await this.auth.deleteMe(pwd);
      this.auth.logout();
      await this.router.navigateByUrl("/register");
    } catch {
      this.delErr = "Не удалось удалить аккаунт";
    } finally {
      this.delBusy = false;
    }
  }

  async logout() {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  roleDisplay(role: string) {
    switch (role) {
      case 'user':
        return 'Пользователь';
      case 'admin':
        return 'Администратор';
      default:
        return role;
    }
  }

  initialsOf(name: string | null | undefined) {
    const s = (name ?? '').trim();
    if (!s) return 'U';
    const parts = s.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? 'U';
    const b = parts.length > 1 ? (parts[1]?.[0] ?? '') : (parts[0]?.[1] ?? '');
    return (a + b).toUpperCase();
  }

  private fillStats(
    books: BookDto[],
    outgoing: DealDto[],
    incoming: DealDto[],
    actionReq: { total: number; buyer: number; seller: number }
  ) {
    const booksAvailable = books.filter(b => b.status === 'available').length;
    const booksReserved = books.filter(b => b.status === 'reserved').length;
    const booksExchanged = books.filter(b => b.status === 'exchanged').length;

    this.stats = {
      booksTotal: books.length,
      booksAvailable,
      booksReserved,
      booksExchanged,

      outgoingTotal: outgoing.length,
      incomingTotal: incoming.length,

      actionRequiredTotal: actionReq.total,
      actionRequiredBuyer: actionReq.buyer,
      actionRequiredSeller: actionReq.seller,
    };
  }
}
