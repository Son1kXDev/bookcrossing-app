import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {firstValueFrom} from "rxjs";
import {RuntimeConfigService} from "../core/runtime-config.service";
import type {DealDto} from "../core/api.types";

@Injectable({ providedIn: "root" })
export class DealsService {
  constructor(private http: HttpClient, private cfg: RuntimeConfigService) {}

  create(bookId: string): Promise<DealDto> {
    return firstValueFrom(this.http.post<DealDto>(`${this.cfg.apiUrl}/deals`, { bookId }));
  }

  my(): Promise<DealDto[]> {
    return firstValueFrom(this.http.get<DealDto[]>(`${this.cfg.apiUrl}/deals/my`));
  }

  deals(userId: string): Promise<DealDto[]> {
    return firstValueFrom(this.http.get<DealDto[]>(`${this.cfg.apiUrl}/deals/user/${userId}`));
  }

  incoming(): Promise<DealDto[]> {
    return firstValueFrom(this.http.get<DealDto[]>(`${this.cfg.apiUrl}/deals/incoming`));
  }

  accept(dealId: string): Promise<DealDto> {
    return firstValueFrom(this.http.post<DealDto>(`${this.cfg.apiUrl}/deals/${dealId}/accept`, {}));
  }

  reject(dealId: string): Promise<{ ok: true }> {
    return firstValueFrom(this.http.post<{ ok: true }>(`${this.cfg.apiUrl}/deals/${dealId}/reject`, {}));
  }

  cancel(dealId: string): Promise<{ ok: true }> {
    return firstValueFrom(this.http.post<{ ok: true }>(`${this.cfg.apiUrl}/deals/${dealId}/cancel`, {}));
  }

  pickup(dealId: string, pickupPointId: string): Promise<DealDto> {
    return firstValueFrom(
      this.http.post<DealDto>(`${this.cfg.apiUrl}/deals/${dealId}/pickup`, { pickupPointId })
    );
  }

  ship(dealId: string, trackingNumber?: string): Promise<DealDto> {
    return firstValueFrom(
      this.http.post<DealDto>(`${this.cfg.apiUrl}/deals/${dealId}/ship`, { trackingNumber })
    );
  }

  receive(dealId: string): Promise<{ ok: true }> {
    return firstValueFrom(this.http.post<{ ok: true }>(`${this.cfg.apiUrl}/deals/${dealId}/receive`, {}));
  }

  async actionRequiredCount(): Promise<{ total: number; buyer: number; seller: number }> {
    const [myDeals, incomingDeals] = await Promise.all([this.my(), this.incoming()]);

    const buyer = myDeals.filter(d => this.needsBuyerAction(d)).length;
    const seller = incomingDeals.filter(d => this.needsSellerAction(d)).length;

    return { total: buyer + seller, buyer, seller };
  }

  private needsBuyerAction(d: DealDto): boolean {
    return d.status === 'accepted' || d.status === 'shipped';
  }

  private needsSellerAction(d: DealDto): boolean {
    return d.status === 'pending' || d.status === 'pickup_selected';
  }

}
