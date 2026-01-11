import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {RuntimeConfigService} from "../core/runtime-config.service";

export type WalletDto = { balance: number; updatedAt: string };

@Injectable({ providedIn: "root" })
export class WalletService {
  constructor(private http: HttpClient, private cfg: RuntimeConfigService) {}

  get(): Promise<WalletDto> {
    return firstValueFrom(this.http.get<WalletDto>(`${this.cfg.apiUrl}/wallet`));
  }
}
