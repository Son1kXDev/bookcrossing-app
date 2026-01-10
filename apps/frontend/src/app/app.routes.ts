import {Routes} from '@angular/router';
import {authGuard} from './auth/auth.guard';
import {LoginComponent} from './pages/login/login.component';
import {RegisterComponent} from './pages/register/register.component';
import {ProfileComponent} from './pages/profile/profile.component';

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "profile" },

  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
  },
  {
    path: "profile",
    canActivate: [authGuard],
    component: ProfileComponent,
  },

  { path: "**", redirectTo: "profile" },
];
