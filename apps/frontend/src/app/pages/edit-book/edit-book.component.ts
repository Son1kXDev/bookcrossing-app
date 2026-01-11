import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BooksService} from '../../services/books.service';
import {FormsModule} from '@angular/forms';
import {RuntimeConfigService} from '../../core/runtime-config.service';
import {BookCondition} from '../../core/api.types';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-edit-book',
  standalone: true,
  imports: [
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './edit-book.component.html',
  styleUrl: './edit-book.component.scss'
})
export class EditBookComponent implements OnInit {
  bookId = "";
  title = "";
  author = "";
  description = "";
  isbn = "";
  category = "";
  condition: BookCondition = null;

  busy = false;
  loading = true;
  error = "";

  coverUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private booksApi: BooksService,
    private router: Router,
    private cfg: RuntimeConfigService
  ) {}

  async onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.error = "Можно загрузить только изображение";
      input.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error = "Файл слишком большой (макс. 2 МБ)";
      input.value = "";
      return;
    }

    this.busy = true;
    this.error = "";
    try {
      const res = await this.booksApi.uploadCover(this.bookId, file);
      this.coverUrl = res.coverUrl ?? "";
    } catch {
      this.error = "Не удалось загрузить обложку";
    } finally {
      this.busy = false;
      input.value = "";
    }
  }

  async ngOnInit() {
    this.bookId = this.route.snapshot.paramMap.get("id") ?? "";
    if (!this.bookId) {
      this.error = "Некорректный id книги";
      this.loading = false;
      return;
    }

    try {
      const my = await this.booksApi.listMy();
      const b = my.find(x => x.id === this.bookId);
      if (!b) {
        this.error = "Книга не найдена";
      } else {
        this.title = b.title ?? "";
        this.author = b.author ?? "";
        this.description = b.description ?? "";
        this.isbn = b.isbn ?? "";
        this.category = b.category ?? "";
        this.condition = b.condition ?? null;
        this.coverUrl = (b as any).coverUrl ?? null;
      }
    } catch {
      this.error = "Не удалось загрузить книгу";
    } finally {
      this.loading = false;
    }
  }

  coverSrc(coverUrl: string) {
    if (coverUrl.startsWith("http")) return coverUrl;
    return `${this.cfg.apiUrl}${coverUrl}`;
  }

  canSubmit() {
    return !this.loading && !this.busy && this.title.trim().length > 0;
  }

  async submit() {
    if (!this.canSubmit()) return;
    this.busy = true;
    this.error = "";
    try {
      await this.booksApi.update(this.bookId, {
        title: this.title.trim(),
        author: this.author.trim() || null,
        description: this.description.trim() || null,
        isbn: this.isbn.trim() || null,
        category: this.category.trim() || null,
        condition: this.condition
      });
      await this.router.navigateByUrl("/books/my");
    } catch (e: any) {
      this.error = "Не удалось сохранить. Возможно, книга уже участвует в сделке.";
    } finally {
      this.busy = false;
    }
  }

  async deleteCover(){
    if (!this.canSubmit()) return;
    this.busy = true;
    this.error = "";
    try {
      await this.booksApi.deleteCover(this.bookId);
      this.coverUrl = null;
    } catch (e: any) {
      this.error = "Не удалось удалить обложку.";
    } finally {
      this.busy = false;
    }
  }
}
