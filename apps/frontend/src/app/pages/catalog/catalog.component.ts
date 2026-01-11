import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {BookDto} from '../../core/api.types';
import {AuthService} from '../../auth/auth.service';
import {DealsService} from '../../services/deals.service';
import {BooksService} from '../../services/books.service';
import {WalletService} from '../../services/wallet.service';
import {RuntimeConfigService} from '../../core/runtime-config.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  books: BookDto[] = [];
  loading = true;
  error = "";
  busyId: string | null = null;
  balance = 0;

  constructor(
    private booksApi: BooksService,
    private dealsApi: DealsService,
    public auth: AuthService,
    private router: Router,
    private wallet: WalletService,
    private cfg: RuntimeConfigService
  ) {}

  async ngOnInit() {
    if (this.auth.hasToken()) {
      const wallet = await this.wallet.get();
      this.balance = wallet?.balance ?? 0;
    }
    await this.reload();
  }

  async reload() {
    this.loading = true;
    this.error = "";
    try {
      this.books = (await this.booksApi.listAll()).filter(b => b.status === "available");
      const wallet = await this.wallet.get();
      this.balance = wallet?.balance ?? 0;
    } catch {
      this.error = "Не удалось загрузить книги";
    } finally {
      this.loading = false;
    }
  }

  coverSrc(coverUrl: string) {
    if (coverUrl.startsWith("http")) return coverUrl;
    return `${this.cfg.apiUrl}${coverUrl}`;
  }

  statusLabel(s: BookDto["status"]) {
    if (s === "available") return "Доступна";
    if (s === "reserved") return "Зарезервирована";
    return "Передана";
  }

  async createDeal(b: BookDto) {
    if (!this.auth.hasToken()) {
      await this.router.navigateByUrl("/login");
      return;
    }
    this.busyId = b.id;
    this.error = "";
    try {
      await this.dealsApi.create(b.id);
      await this.reload();
      await this.router.navigateByUrl("/deals");
    } catch (e: any) {
      this.error = "Не удалось создать сделку (возможно, книга уже зарезервирована).";
    } finally {
      this.busyId = null;
    }
  }
}
