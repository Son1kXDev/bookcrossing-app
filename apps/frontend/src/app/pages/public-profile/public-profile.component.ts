import {Component, OnInit} from '@angular/core';
import {RuntimeConfigService} from '../../core/runtime-config.service';
import {AuthService} from '../../auth/auth.service';
import {PublicUserDto, UsersService} from '../../services/users.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {BookDto, DealDto} from '../../core/api.types';
import {DatePipe} from '@angular/common';
import {BooksService} from '../../services/books.service';
import {DealsService} from '../../services/deals.service';

type PublicProfileStats = {
  booksTotal: number;
  booksAvailable: number;
  booksReserved: number;
  booksExchanged: number;

  outgoingTotal: number;
  incomingTotal: number;
};

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe
  ],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss'
})
export class PublicProfileComponent implements OnInit {
  loading = true;
  error = "";

  userId = "";
  user: PublicUserDto | null = null;

  stats: PublicProfileStats = {
    booksTotal: 0,
    booksAvailable: 0,
    booksReserved: 0,
    booksExchanged: 0,
    outgoingTotal: 0,
    incomingTotal: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersApi: UsersService,
    public auth: AuthService,
    private cfg: RuntimeConfigService,
    private booksApi: BooksService,
    private dealsApi: DealsService
  ) {}

  async ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get("id") ?? "";
    if (!this.userId) {
      this.error = "Некорректный id пользователя";
      this.loading = false;
      return;
    }

    const me = this.auth.userInfo;
    if (me?.id && me.id === this.userId) {
      await this.router.navigateByUrl("/profile");
      return;
    }

    await this.load();
  }

  async load() {
    this.loading = true;
    this.error = "";
    try {
      this.user = await this.usersApi.getPublicProfile(this.userId);

      const books = (await this.booksApi.listAll()).filter(b => b.owner?.id === this.userId);

      const deals = await this.dealsApi.deals(this.userId);
      const buyerDeals = deals.filter(d => d.buyer?.id === this.userId);
      const sellerDeals = deals.filter(d => d.seller?.id === this.userId);

      this.fillStats(books, buyerDeals, sellerDeals);
    } catch (e: any) {
      this.error = 'Не удалось загрузить профиль пользователя';
    } finally {
      this.loading = false;
    }
  }

  roleDisplay(role: string) {
    switch (role) {
      case "user": return "Пользователь";
      case "admin": return "Администратор";
      default: return role;
    }
  }

  initialsOf(name: string | null | undefined) {
    const s = (name ?? "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts.length > 1 ? (parts[1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
    return (a + b).toUpperCase();
  }

  avatarSrc(avatarUrl?: string | null) {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith("http")) return avatarUrl;
    return `${this.cfg.apiUrl}${avatarUrl}`;
  }

  private fillStats(books: BookDto[], buyerDeals: DealDto[], sellerDeals: DealDto[]) {
    const booksAvailable = books.filter(b => b.status === 'available').length;
    const booksReserved = books.filter(b => b.status === 'reserved').length;
    const booksExchanged = books.filter(b => b.status === 'exchanged').length;

    this.stats = {
      booksTotal: books.length,
      booksAvailable,
      booksReserved,
      booksExchanged,
      outgoingTotal: buyerDeals.length,
      incomingTotal: sellerDeals.length,
    };
  }
}
