import { Injectable } from '@angular/core';

export const STORAGE_KEYS = {
  USERNAME: 'username',
  PROFILE_ID: 'profileId',
  DEVICE_ID: 'porton_device_id',
  FCM_TOKEN: 'porton_fcm_token',
  THEME_CONFIG: 'porton-theme-config',
  WINDOW_POSITIONS: 'windowPositions',
  SELECTED_LANGUAGE: 'portonSelectedLanguage',
  SCHEDULE_CELL_HEIGHT: 'portonScheduleCellHeight',
  RESERVATIONS_CELL_HEIGHT: 'portonReservationsCellHeight',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export const PERSISTENT_KEYS: StorageKey[] = [
  STORAGE_KEYS.SELECTED_LANGUAGE,
  STORAGE_KEYS.DEVICE_ID,
  STORAGE_KEYS.THEME_CONFIG,
];

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  
  get<T>(key: StorageKey): T | null {
    const value = localStorage.getItem(key);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  getString(key: StorageKey): string | null {
    return localStorage.getItem(key);
  }

  set(key: StorageKey, value: unknown): void {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  }

  remove(key: StorageKey): void {
    localStorage.removeItem(key);
  }

  clearExceptPersistent(): void {
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!PERSISTENT_KEYS.includes(key as StorageKey)) {
        localStorage.removeItem(key);
      }
    });
  }

  clear(): void {
    localStorage.clear();
  }
}
