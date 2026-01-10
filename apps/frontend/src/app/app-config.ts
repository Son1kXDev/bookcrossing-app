export type AppConfig = {
  apiUrl: string;
};

let config: AppConfig | null = null;

export async function loadAppConfig(): Promise<void> {
  const res = await fetch('/config.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load /config.json: ${res.status} ${res.statusText}`);
  }
  config = await res.json();
}

export function getAppConfig(): AppConfig {
  if (!config) {
    throw new Error('App config not loaded');
  }
  return config;
}
