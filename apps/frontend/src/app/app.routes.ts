import {Routes} from '@angular/router';
import {authGuard} from './auth/auth.guard';
import {LoginComponent} from './pages/login/login.component';
import {RegisterComponent} from './pages/register/register.component';
import {ProfileComponent} from './pages/profile/profile.component';
import {CatalogComponent} from './pages/catalog/catalog.component';
import {MyBooksComponent} from './pages/my-books/my-books.component';
import {NewBookComponent} from './pages/new-book/new-book.component';
import {MyDealsComponent} from './pages/my-deals/my-deals.component';
import {IncomingDealsComponent} from './pages/incoming-deals/incoming-deals.component';

export const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "catalog" },

  {path: "login", component: LoginComponent,},
  {path: "register", component: RegisterComponent,},
  {
    path: "profile",
    canActivate: [authGuard],
    component: ProfileComponent,
  },
  { path: "catalog", component: CatalogComponent },
  { path: "books/my", canActivate: [authGuard], component: MyBooksComponent },
  { path: "books/new", canActivate: [authGuard], component: NewBookComponent },
  { path: "deals/my", canActivate: [authGuard], component: MyDealsComponent },
  { path: "deals/incoming", canActivate: [authGuard], component: IncomingDealsComponent },
  { path: "**", redirectTo: "catalog" },
];
