import {Routes} from '@angular/router';
import {authGuard} from './auth/auth.guard';
import {LoginComponent} from './pages/login/login.component';
import {RegisterComponent} from './pages/register/register.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {CatalogComponent} from './pages/catalog/catalog.component';
import {MyBooksComponent} from './pages/my-books/my-books.component';
import {NewBookComponent} from './pages/new-book/new-book.component';
import {ShellComponent} from './core/shell/shell.component';
import {DealsComponent} from './pages/deals/deals.component';

export const routes: Routes = [
  {path: "login", component: LoginComponent,},
  {path: "register", component: RegisterComponent,},
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: "catalog", component: CatalogComponent },
      { path: "profile", canActivate: [authGuard], component: ProfileComponent },
      { path: "books/my", canActivate: [authGuard], component: MyBooksComponent },
      { path: "books/new", canActivate: [authGuard], component: NewBookComponent },
      { path: "deals", canActivate: [authGuard], component: DealsComponent },
      { path: "**", redirectTo: "catalog" },
    ]
  },
];
