import {Component} from '@angular/core';
import {BooksService} from '../../services/books.service';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-new-book',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './new-book.component.html',
  styleUrl: './new-book.component.scss'
})
export class NewBookComponent {
  title = "";
  author = "";
  description = "";
  busy = false;
  error = "";

  constructor(private booksApi: BooksService, private router: Router) {}

  async submit() {
    this.error = "";
    this.busy = true;
    try {
      await this.booksApi.create({
        title: this.title.trim(),
        author: this.author.trim() || undefined,
        description: this.description.trim() || undefined,
      });
      await this.router.navigateByUrl("/books/my");
    } catch {
      this.error = "Не удалось создать книгу";
    } finally {
      this.busy = false;
    }
  }
}
