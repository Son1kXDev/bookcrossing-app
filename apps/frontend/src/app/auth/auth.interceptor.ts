import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {TokenStorage} from "./token.storage";
import {RuntimeConfigService} from '../core/runtime-config.service';
import {Observable} from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private cfg: RuntimeConfigService, private tokens: TokenStorage) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokens.get();

    if (!token || !this.cfg.isLoaded) {
      return next.handle(req);
    }

    const apiUrl = this.cfg.apiUrl;
    const isOurApi = req.url.startsWith(apiUrl);

    if (!isOurApi) {
      return next.handle(req);
    }

    return next.handle(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    );
  }
}

export const httpInterceptorProviders = [
  {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
];
