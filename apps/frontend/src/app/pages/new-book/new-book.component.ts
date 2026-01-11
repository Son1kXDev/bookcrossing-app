import {Component} from '@angular/core';
import {BooksService} from '../../services/books.service';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SafeUrl} from '@angular/platform-browser';

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
  coverFile: File | null = null;
  coverLocalUrl: SafeUrl | undefined;
  cover: any;

  constructor(private booksApi: BooksService, private router: Router) {}

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
      });
      if (this.coverFile) {
        await this.booksApi.uploadCover(created.id, this.coverFile);
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
    this.busy = false;
  }
}
