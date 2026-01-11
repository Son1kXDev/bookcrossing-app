import {Component, OnInit} from '@angular/core';
import {DealDto, DealStatus} from '../../core/api.types';
import {DealsService} from '../../services/deals.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-incoming-deals',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './incoming-deals.component.html',
  styleUrl: './incoming-deals.component.scss'
})
export class IncomingDealsComponent implements OnInit {
  deals: DealDto[] = [];
  loading = true;
  error = "";
  tracking: Record<string, string> = {};

  constructor(private dealsApi: DealsService) {}

  async ngOnInit() {
    await this.reload();
  }

  statusLabel(s: DealStatus) {
    switch (s) {
      case "pending": return "Ожидает вашего подтверждения";
      case "accepted": return "Подтверждена (ждём выбор ПВЗ покупателем)";
      case "pickup_selected": return "ПВЗ выбран (нужно отправить книгу)";
      case "shipped": return "Отправлено (ждём подтверждение получения)";
      case "completed": return "Завершена";
      case "rejected": return "Отклонена";
      case "cancelled": return "Отменена покупателем";
      default: return s;
    }
  }

  async reload() {
    this.loading = true;
    this.error = "";
    try {
      this.deals = await this.dealsApi.incoming();
    } catch {
      this.error = "Не удалось загрузить входящие сделки";
    } finally {
      this.loading = false;
    }
  }

  async accept(d: DealDto) {
    this.error = "";
    try {
      await this.dealsApi.accept(d.id);
      await this.reload();
    } catch {
      this.error = "Не удалось подтвердить сделку";
    }
  }

  async reject(d: DealDto) {
    this.error = "";
    try {
      await this.dealsApi.reject(d.id);
      await this.reload();
    } catch {
      this.error = "Не удалось отклонить сделку";
    }
  }

  async ship(d: DealDto) {
    this.error = "";
    try {
      await this.dealsApi.ship(d.id, this.tracking[d.id]?.trim() || undefined);
      await this.reload();
    } catch {
      this.error = "Не удалось подтвердить отправку";
    }
  }
}
