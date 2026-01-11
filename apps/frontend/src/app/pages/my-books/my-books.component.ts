import {Component, OnInit} from '@angular/core';
import {BookDto} from '../../core/api.types';
import {BooksService} from '../../services/books.service';
import {RouterLink} from '@angular/router';
import {RuntimeConfigService} from '../../core/runtime-config.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-my-books',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage
  ],
  templateUrl: './my-books.component.html',
  styleUrl: './my-books.component.scss'
})
export class MyBooksComponent implements OnInit {
  books: BookDto[] = [];
  loading = true;
  error = "";
  busyId: string | null = null;

  constructor(private booksApi: BooksService, private cfg: RuntimeConfigService) {}

  async ngOnInit() {
    try {
      this.books = await this.booksApi.listMy();
    } catch {
      this.error = "Не удалось загрузить ваши книги";
    } finally {
      this.loading = false;
    }
  }

  coverSrc(coverUrl: string) {
    if (coverUrl.startsWith("http")) return coverUrl;
    return `${this.cfg.apiUrl}${coverUrl}`;
  }

  conditionLabel(v: string | null | undefined) {
    switch (v) {
      case "new": return "Новая";
      case "like_new": return "Как новая";
      case "very_good": return "Отличное";
      case "good": return "Хорошее";
      case "acceptable": return "Удовлетворительное";
      case "poor": return "Плохое";
      default: return v ?? "";
    }
  }

  async remove(b: BookDto) {
    this.error = "";
    this.busyId = b.id;
    try {
      await this.booksApi.deleteCover(b.id);
      await this.booksApi.delete(b.id);
      this.books = this.books.filter(x => x.id !== b.id);
    } catch {
      this.error = "Не удалось удалить книгу. Возможно, по ней есть активная сделка.";
    } finally {
      this.busyId = null;
    }
  }

  async relist(bookId: string) {
    this.error = "";
    this.busyId = bookId;
    try {
      await this.booksApi.relist(bookId);
      this.books = await this.booksApi.listMy();
    } catch {
      this.error = "Не удалось повторно выставить книгу";
    } finally {
      this.busyId = null;
    }
  }
}
