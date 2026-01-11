import {Component, OnInit} from '@angular/core';
import {BookDto} from '../../core/api.types';
import {BooksService} from '../../services/books.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-my-books',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './my-books.component.html',
  styleUrl: './my-books.component.scss'
})
export class MyBooksComponent implements OnInit {
  books: BookDto[] = [];
  loading = true;
  error = "";
  busyId: string | null = null;

  constructor(private booksApi: BooksService) {}

  async ngOnInit() {
    try {
      this.books = await this.booksApi.listMy();
    } catch {
      this.error = "Не удалось загрузить ваши книги";
    } finally {
      this.loading = false;
    }
  }

  async remove(b: BookDto) {
    this.error = "";
    this.busyId = b.id;
    try {
      await this.booksApi.delete(b.id);
      this.books = this.books.filter(x => x.id !== b.id);
    } catch {
      this.error = "Не удалось удалить книгу. Возможно, по ней есть активная сделка.";
    } finally {
      this.busyId = null;
    }
  }
}
