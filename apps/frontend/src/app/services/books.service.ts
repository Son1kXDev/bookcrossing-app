import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {RuntimeConfigService} from "../core/runtime-config.service";
import type {BookDto} from "../core/api.types";

@Injectable({ providedIn: "root" })
export class BooksService {
  constructor(private http: HttpClient, private cfg: RuntimeConfigService) {}

  listAll(): Promise<BookDto[]> {
    return firstValueFrom(this.http.get<BookDto[]>(`${this.cfg.apiUrl}/books`));
  }

  listMy(): Promise<BookDto[]> {
    return firstValueFrom(this.http.get<BookDto[]>(`${this.cfg.apiUrl}/books/my`));
  }

  create(dto: { title: string; author?: string; description?: string }): Promise<BookDto> {
    return firstValueFrom(this.http.post<BookDto>(`${this.cfg.apiUrl}/books`, dto));
  }

  update(bookId: string, dto: { title?: string; author?: string | null; description?: string | null }): Promise<BookDto> {
    return firstValueFrom(this.http.patch<BookDto>(`${this.cfg.apiUrl}/books/${bookId}`, dto));
  }

  delete(bookId: string) {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.cfg.apiUrl}/books/${bookId}`));
  }
}
