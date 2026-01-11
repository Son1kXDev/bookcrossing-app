import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DealDto, DealStatus, PickupPointDto} from '../../core/api.types';
import {DealsService} from '../../services/deals.service';
import {PvzPickerComponent} from '../../shared/pvz-picker/pvz-picker.component';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-deals',
  standalone: true,
  imports: [FormsModule, PvzPickerComponent, RouterLink],
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

  badgeForOutgoing(status: DealStatus): { text: string; cls: string } {
    switch (status) {
      case "pending":
        return { text: "Ожидает продавца", cls: "badge badge-neutral" };
      case "accepted":
        return { text: "Нужно выбрать ПВЗ", cls: "badge badge-yellow" };
      case "pickup_selected":
        return { text: "ПВЗ выбран", cls: "badge badge-neutral" };
      case "shipped":
        return { text: "Нужно подтвердить получение", cls: "badge badge-yellow" };
      case "completed":
        return { text: "Завершена", cls: "badge badge-green" };
      case "rejected":
        return { text: "Отклонена", cls: "badge badge-red" };
      case "cancelled":
        return { text: "Отменена", cls: "badge badge-red" };
    }
  }

  badgeForIncoming(status: DealStatus): { text: string; cls: string } {
    switch (status) {
      case "pending":
        return { text: "Нужно подтвердить", cls: "badge badge-yellow" };
      case "accepted":
        return { text: "Покупатель выбирает ПВЗ", cls: "badge badge-neutral" };
      case "pickup_selected":
        return { text: "Нужно отправить", cls: "badge badge-yellow" };
      case "shipped":
        return { text: "Отправлено", cls: "badge badge-neutral" };
      case "completed":
        return { text: "Завершена", cls: "badge badge-green" };
      case "rejected":
        return { text: "Отклонена", cls: "badge badge-red" };
      case "cancelled":
        return { text: "Отменена покупателем", cls: "badge badge-red" };
    }
  }

  needsBuyerAction(d: DealDto): boolean {
    return d.status === "accepted" || d.status === "shipped";
  }

  needsSellerAction(d: DealDto): boolean {
    return d.status === "pending" || d.status === "pickup_selected";
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
