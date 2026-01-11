import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {RuntimeConfigService} from "../core/runtime-config.service";
import type {UserDto} from "../auth/auth.service";

export type PublicUserDto = {
  id: string;
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
};

@Injectable({ providedIn: "root" })
export class UsersService {
  constructor(private http: HttpClient, private cfg: RuntimeConfigService) {}

  updateMe(dto: { displayName?: string }): Promise<UserDto> {
    return firstValueFrom(this.http.patch<UserDto>(`${this.cfg.apiUrl}/users/me`, dto));
  }

  uploadAvatar(file: File): Promise<UserDto> {
    const fd = new FormData();
    fd.append("file", file);
    return firstValueFrom(this.http.post<UserDto>(`${this.cfg.apiUrl}/users/me/avatar`, fd));
  }

  deleteAvatar(): Promise<{ ok: true }> {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.cfg.apiUrl}/users/me/avatar`));
  }

  getPublicProfile(userId: string): Promise<PublicUserDto> {
    return firstValueFrom(this.http.get<PublicUserDto>(`${this.cfg.apiUrl}/users/${userId}`));
  }
}
