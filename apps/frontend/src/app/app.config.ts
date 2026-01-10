import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {RuntimeConfigService} from './core/runtime-config.service';
import {authInterceptor} from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (cfg: RuntimeConfigService, http: HttpClient)=> () => cfg.load(http),
      deps: [RuntimeConfigService, HttpClient]
    }
  ]
};
