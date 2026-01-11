import {Component} from '@angular/core';
import {BooksService} from '../../services/books.service';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SafeUrl} from '@angular/platform-browser';
import {BookCondition} from '../../core/api.types';
import {GoogleBook, GoogleBooksService} from '../../services/google-books.service';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-new-book',
  standalone: true,
  imports: [
    FormsModule,
    NgOptimizedImage
  ],
  templateUrl: './new-book.component.html',
  styleUrl: './new-book.component.scss'
})
export class NewBookComponent {
  title = "";
  author = "";
  description = "";
  isbn = "";
  category = "";
  condition: BookCondition = null;
  busy = false;
  error = "";
  coverFile: File | null = null;
  coverLocalUrl: SafeUrl | undefined;
  cover: any;

  searchQuery = "";
  searching = false;
  searchError = "";
  searchResults: GoogleBook[] = [];
  googleCoverUrl: string | null = null;
  private searchTimer: any = null;

  constructor(private booksApi: BooksService, private router: Router, private googleBooks: GoogleBooksService) {}

  get imageSource(){
    return this.googleCoverUrl ?? this.coverLocalUrl;
  }

  onSearchInput() {
    const q = this.searchQuery.trim();
    this.searchError = "";

    if (this.searchTimer) clearTimeout(this.searchTimer);

    if (q.length < 2) {
      this.searchResults = [];
      this.searching = false;
      return;
    }

    this.searchTimer = setTimeout(() => this.runSearch(q), 350);
  }

  applyGoogleBook(b: GoogleBook) {
    this.pickFromGoogle(b);
    this.searchResults = [];
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
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
    this.coverFile = file;
    this.error = "";
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.coverLocalUrl = ev.target?.result as SafeUrl;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  async submit() {
    this.error = "";
    this.busy = true;
    try {
      const created = await this.booksApi.create({
        title: this.title.trim(),
        author: this.author.trim() || undefined,
        description: this.description.trim() || undefined,
        isbn: this.isbn.trim() || undefined,
        category: this.category.trim() || undefined,
        condition: this.condition || undefined,
      });
      if (this.coverFile) {
        await this.booksApi.uploadCover(created.id, this.coverFile);
      } else if (this.googleCoverUrl){
        await this.booksApi.setCoverFromUrl(created.id, this.googleCoverUrl);
      }
      await this.router.navigateByUrl("/books/my");
    } catch {
      this.error = "Не удалось создать книгу";
    } finally {
      this.busy = false;
    }

  }

  async deleteCover(){
    if (this.busy || !this.coverLocalUrl || !this.coverFile) return;
    this.busy = true;
    this.coverFile = null;
    this.coverLocalUrl = undefined;
    this.cover = null;
    this.googleCoverUrl = null;
    this.busy = false;
  }

  async pickFromGoogle(b: GoogleBook) {
    this.title = b.title ?? "";
    this.author = b.author ?? "";
    this.description = b.description ?? "";
    this.category = b.category ?? "";
    this.isbn = b.isbn ?? "";

    this.googleCoverUrl = b.thumbnailUrl ?? null;

    console.log(this.googleCoverUrl);
  }

  protected async runSearch(q: string) {
    this.searching = true;
    try {
      this.searchResults = await this.googleBooks.search(q);
    } catch {
      this.searchError = "Не удалось выполнить поиск в каталоге";
      this.searchResults = [];
    } finally {
      this.searching = false;
    }
  }
}
