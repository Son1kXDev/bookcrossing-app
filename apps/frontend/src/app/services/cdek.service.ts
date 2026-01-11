import {Injectable} from "@angular/core";
import {HttpClient, HttpParams} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {RuntimeConfigService} from "../core/runtime-config.service";
import type {PickupPointDto} from "../core/api.types";

@Injectable({ providedIn: "root" })
export class CdekService {
  constructor(private http: HttpClient, private cfg: RuntimeConfigService) {}

  pvz(query: { city?: string; type?: "PVZ" | "POSTAMAT"; countryCode?: string } = {}): Promise<PickupPointDto[]> {
    let params = new HttpParams();
    if (query.city) params = params.set("city", query.city);
    if (query.type) params = params.set("type", query.type);
    if (query.countryCode) params = params.set("countryCode", query.countryCode);

    return firstValueFrom(
      this.http.get<PickupPointDto[]>(`${this.cfg.apiUrl}/cdek/pvz`, { params })
    );
  }
}
