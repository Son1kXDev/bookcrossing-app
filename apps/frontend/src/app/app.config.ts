import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {HttpClient, provideHttpClient} from '@angular/common/http';
import {RuntimeConfigService} from './core/runtime-config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (cfg: RuntimeConfigService, http: HttpClient)=> () => cfg.load(http),
      deps: [RuntimeConfigService, HttpClient]
    }
  ]
};
