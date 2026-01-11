import {Component, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {BookDto} from '../../core/api.types';
import {AuthService} from '../../auth/auth.service';
import {DealsService} from '../../services/deals.service';
import {BooksService} from '../../services/books.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss'
})
export class CatalogComponent implements OnInit {
  books: BookDto[] = [];
  loading = true;
  error = "";
  busyId: string | null = null;

  constructor(
    private booksApi: BooksService,
    private dealsApi: DealsService,
    public auth: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.loading = true;
    this.error = "";
    try {
      this.books = await this.booksApi.listAll();
    } catch {
      this.error = "Не удалось загрузить книги";
    } finally {
      this.loading = false;
    }
  }

  statusLabel(s: BookDto["status"]) {
    if (s === "available") return "Доступна";
    if (s === "reserved") return "Зарезервирована";
    return "Передана";
  }

  async createDeal(b: BookDto) {
    if (!this.auth.hasToken()) {
      this.router.navigateByUrl("/login");
      return;
    }
    this.busyId = b.id;
    this.error = "";
    try {
      await this.dealsApi.create(b.id);
      await this.reload();
      this.router.navigateByUrl("/deals/my");
    } catch (e: any) {
      this.error = "Не удалось создать сделку (возможно, книга уже зарезервирована).";
    } finally {
      this.busyId = null;
    }
  }
}
