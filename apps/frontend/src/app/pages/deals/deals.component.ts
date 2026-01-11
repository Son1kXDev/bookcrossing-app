import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DealDto, DealStatus, PickupPointDto} from '../../core/api.types';
import {DealsService} from '../../services/deals.service';
import {PvzPickerComponent} from '../../shared/pvz-picker/pvz-picker.component';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [FormsModule, PvzPickerComponent],
  templateUrl: './deals.component.html',
  styleUrl: './deals.component.scss'
})
export class DealsComponent implements OnInit {
  outgoing: DealDto[] = [];
  incoming: DealDto[] = [];

  loading = true;
  error = "";

  pvzOpen = false;
  pvzDealId: string | null = null;

  tracking: Record<string, string> = {};

  constructor(private dealsApi: DealsService) {}

  async ngOnInit() {
    await this.reload();
  }

  async reload() {
    this.loading = true;
    this.error = "";
    try {
      const [my, incoming] = await Promise.all([
        this.dealsApi.my(),
        this.dealsApi.incoming()
      ]);
      this.outgoing = my;
      this.incoming = incoming;
    } catch {
      this.error = "Не удалось загрузить сделки";
    } finally {
      this.loading = false;
    }
  }

  outgoingStatusLabel(s: DealStatus) {
    switch (s) {
      case "pending": return "Ожидает подтверждения продавца";
      case "accepted": return "Подтверждена продавцом (выберите ПВЗ)";
      case "pickup_selected": return "ПВЗ выбран (ждём отправку)";
      case "shipped": return "Отправлено (подтвердите получение)";
      case "completed": return "Завершена";
      case "rejected": return "Отклонена продавцом";
      case "cancelled": return "Отменена";
    }
  }

  incomingStatusLabel(s: DealStatus) {
    switch (s) {
      case "pending": return "Ожидает вашего подтверждения";
      case "accepted": return "Подтверждена (ждём выбор ПВЗ покупателем)";
      case "pickup_selected": return "ПВЗ выбран (нужно отправить книгу)";
      case "shipped": return "Отправлено (ждём подтверждение получения)";
      case "completed": return "Завершена";
      case "rejected": return "Отклонена";
      case "cancelled": return "Отменена покупателем";
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
    this.error = "";

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
      await this.dealsApi.ship(d.id, this.tracking[d.id].trim());
      await this.reload();
    } catch {
      this.error = "Не удалось подтвердить отправку";
    }
  }

  titleOf(d: DealDto) {
    return d.book?.title ?? "Книга";
  }
}
