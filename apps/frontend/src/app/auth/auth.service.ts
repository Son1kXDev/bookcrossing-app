import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {RuntimeConfigService} from '../core/runtime-config.service';
import {TokenStorage} from './token.storage';
import {firstValueFrom} from 'rxjs';

export type UserDto = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  wallet?: { balance: number; updatedAt: string } | null;
};

type AuthResponse = { token: string; user: UserDto };

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private cfg: RuntimeConfigService,
    private tokenStorage: TokenStorage
  ) {}

  async register(email: string, password: string, displayName: string): Promise<UserDto> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.cfg.apiUrl}/auth/register`, { email, password, displayName })
    );
    this.tokenStorage.set(res.token);
    return res.user;
  }

  async login(email: string, password: string): Promise<UserDto> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.cfg.apiUrl}/auth/login`, { email, password })
    );
    this.tokenStorage.set(res.token);
    return res.user;
  }

  async me(): Promise<UserDto> {
    return await firstValueFrom(
      this.http.get<UserDto>(`${this.cfg.apiUrl}/auth/me`)
    );
  }

  logout(){
    this.tokenStorage.clear();
  }

  hasToken(): boolean {
    return !!this.tokenStorage.get();
  }

}
