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
}
