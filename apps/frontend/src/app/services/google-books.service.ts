import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

export type GoogleBooksResponse = {
  items?: Array<{
    id: string;
    volumeInfo?: {
      title?: string;
      authors?: string[];
      description?: string;
      categories?: string[];
      publishedDate?: string;
      imageLinks?: {
        smallThumbnail?: string;
        thumbnail?: string;
      };
      industryIdentifiers?: Array<{
        type?: string;
        identifier?: string;
      }>;
    };
  }>;
};

export type GoogleBook = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  category?: string;
  isbn?: string;
  thumbnailUrl?: string;
};

type GoogleBooksItem = NonNullable<GoogleBooksResponse["items"]>[number];

@Injectable({
  providedIn: 'root'
})
export class GoogleBooksService {

  constructor(private http: HttpClient) { }

  async search(q: string): Promise<GoogleBook[]> {
    const query = q.trim();
    if (!query) return [];

    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`;
    const res = await firstValueFrom(this.http.get<GoogleBooksResponse>(url));

    const items = res.items ?? [];
    return items
      .map(it => this.mapItem(it))
      .filter((x): x is GoogleBook => !!x);
  }

  async downloadAsFile(url: string, filename = "cover.jpg"): Promise<File> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("DOWNLOAD_FAILED");

    const blob = await resp.blob();
    const type = blob.type || "image/jpeg";

    const ext =
      type.includes("png") ? "png" :
        type.includes("webp") ? "webp" : "jpg";

    return new File([blob], filename.replace(/\.\w+$/, "") + "." + ext, { type });
  }

  private mapItem(it: GoogleBooksItem): GoogleBook | null {
    const vi = it.volumeInfo;
    const title = vi?.title?.trim();
    if (!title) return null;

    const author = vi?.authors?.[0]?.trim();
    const description = vi?.description?.trim();
    const category = vi?.categories?.[0]?.trim();

    const isbn =
      vi?.industryIdentifiers?.find(x => x.type === "ISBN_13")?.identifier ??
      vi?.industryIdentifiers?.find(x => x.type === "ISBN_10")?.identifier;

    const thumbnailUrl =
      vi?.imageLinks?.thumbnail ??
      vi?.imageLinks?.smallThumbnail;

    return {
      id: it.id,
      title,
      author,
      description,
      category,
      isbn,
      thumbnailUrl,
    };
  }

}
