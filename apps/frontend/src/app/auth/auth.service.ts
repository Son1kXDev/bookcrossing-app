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
  avatarUrl?: string | null;
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

  get userInfo(): UserDto | null {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) as UserDto : null;
  }

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

  async changePassword(currentPassword: string, newPassword: string): Promise<{ ok: true }> {
    return await firstValueFrom(
      this.http.post<{ ok: true }>(`${this.cfg.apiUrl}/auth/change-password`, { currentPassword, newPassword })
    );
  }

  async deleteMe(password: string): Promise<{ ok: true }> {
    return await firstValueFrom(
      this.http.request<{ ok: true }>("delete", `${this.cfg.apiUrl}/auth/me`, { body: { password } })
    );
  }


  logout(){
    this.tokenStorage.clear();
    this.clearUserInfo();
  }

  hasToken(): boolean {
    return !!this.tokenStorage.get();
  }

  async getOrSaveUserInfo() {
    if (!this.hasToken()) return Promise.reject('No token');

    const user = this.userInfo;
    if (user) return Promise.resolve(user);

    const user_1 = await this.me();
    this.setUserInfo(user_1);
    return user_1;
  }

  clearUserInfo(){
    localStorage.removeItem('userInfo');
  }

  private setUserInfo(user: UserDto) {
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

}
