import {Injectable} from '@angular/core';
import {HttpBackend, HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

export type RuntimeConfig = {apiUrl: string};

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {

  private _config: RuntimeConfig | null = null;

  constructor(private httpBackend: HttpBackend) {}

  get apiUrl():string {
    return this._config?.apiUrl ?? "";
  }

  get isLoaded(): boolean {
    return !!this._config?.apiUrl;
  }

  async load(){
    const http = new HttpClient(this.httpBackend);
    this._config = await firstValueFrom(http.get<RuntimeConfig>("/config.json"))
  }
}
