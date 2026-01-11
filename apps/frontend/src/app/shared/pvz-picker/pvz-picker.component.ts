import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CdekService} from '../../services/cdek.service';
import {PickupPointDto} from '../../core/api.types';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-pvz-picker',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './pvz-picker.component.html',
  styleUrl: './pvz-picker.component.scss'
})
export class PvzPickerComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() selected = new EventEmitter<PickupPointDto>();

  city = "Москва";
  points: PickupPointDto[] = [];
  loading = false;
  error = "";

  constructor(private cdek: CdekService) {}

  async load() {
    this.loading = true;
    this.error = "";
    try {
      this.points = await this.cdek.pvz({ city: this.city, type: "PVZ", countryCode: "RU" });
    } catch {
      this.error = "Не удалось получить список ПВЗ";
    } finally {
      this.loading = false;
    }
  }

  pick(p: PickupPointDto) {
    this.selected.emit(p);
  }
}
