import {Component, OnInit} from '@angular/core';
import {DealDto, DealStatus, PickupPointDto} from '../../core/api.types';
import {DealsService} from '../../services/deals.service';
import {PvzPickerComponent} from '../../shared/pvz-picker/pvz-picker.component';

@Component({
  selector: 'app-my-deals',
  standalone: true,
  imports: [
    PvzPickerComponent
  ],
  templateUrl: './my-deals.component.html',
  styleUrl: './my-deals.component.scss'
})
export class MyDealsComponent implements OnInit {
  deals: DealDto[] = [];
  loading = true;
  error = "";

  pvzOpen = false;
  pvzDealId: string | null = null;

  constructor(private dealsApi: DealsService) {}

  async ngOnInit() {
    await this.reload();
  }

  statusLabel(s: DealStatus) {
    switch (s) {
      case "pending": return "Ожидает подтверждения продавца";
      case "accepted": return "Подтверждена продавцом (выберите ПВЗ)";
      case "pickup_selected": return "ПВЗ выбран (ждём отправку)";
      case "shipped": return "Отправлено (подтвердите получение)";
      case "completed": return "Завершена";
      case "rejected": return "Отклонена продавцом";
      case "cancelled": return "Отменена";
      default: return s;
    }
  }

  async reload() {
    this.loading = true;
    this.error = "";
    try {
      this.deals = await this.dealsApi.my();
    } catch {
      this.error = "Не удалось загрузить сделки";
    } finally {
      this.loading = false;
    }
  }

  openPvz(d: DealDto) {
    this.pvzDealId = d.id;
    this.pvzOpen = true;
  }

  async selectPvz(p: PickupPointDto) {
    const dealId = this.pvzDealId;
    if (!dealId) return;
    this.pvzOpen = false;

    try {
      await this.dealsApi.pickup(dealId, p.code);
      await this.reload();
    } catch {
      this.error = "Не удалось выбрать ПВЗ";
    } finally {
      this.pvzDealId = null;
    }
  }

  async cancel(d: DealDto) {
    this.error = "";
    try {
      await this.dealsApi.cancel(d.id);
      await this.reload();
    } catch {
      this.error = "Не удалось отменить сделку";
    }
  }

  async receive(d: DealDto) {
    this.error = "";
    try {
      await this.dealsApi.receive(d.id);
      await this.reload();
    } catch {
      this.error = "Не удалось подтвердить получение";
    }
  }
}
