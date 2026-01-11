import {APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {RuntimeConfigService} from './core/runtime-config.service';
import {httpInterceptorProviders} from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (cfg: RuntimeConfigService)=> () => cfg.load(),
      deps: [RuntimeConfigService]
    },
    provideHttpClient(withInterceptorsFromDi()),
    httpInterceptorProviders,
  ]
};
