import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';

export type RuntimeConfig = {apiUrl: string};

@Injectable({
  providedIn: 'root'
})
export class RuntimeConfigService {

  private _config!: RuntimeConfig;

  get apiUrl():string {
    return this._config.apiUrl;
  }

  async load(http: HttpClient){
    this._config = await firstValueFrom(http.get<RuntimeConfig>("/config.json"))
  }
}
