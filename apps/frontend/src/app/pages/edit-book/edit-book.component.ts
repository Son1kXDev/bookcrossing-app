import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {BooksService} from '../../services/books.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-edit-book',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './edit-book.component.html',
  styleUrl: './edit-book.component.scss'
})
export class EditBookComponent implements OnInit {
  bookId = "";
  title = "";
  author = "";
  description = "";

  busy = false;
  loading = true;
  error = "";

  constructor(
    private route: ActivatedRoute,
    private booksApi: BooksService,
    private router: Router
  ) {}

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
      }
    } catch {
      this.error = "Не удалось загрузить книгу";
    } finally {
      this.loading = false;
    }
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
      });
      await this.router.navigateByUrl("/books/my");
    } catch (e: any) {
      this.error = "Не удалось сохранить. Возможно, книга уже участвует в сделке.";
    } finally {
      this.busy = false;
    }
  }
}
