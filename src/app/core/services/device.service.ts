import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StorageService, STORAGE_KEYS } from './storage.service';

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor(
    private supabaseService: SupabaseService,
    private storageService: StorageService,
  ) {
    this.ensureDeviceId();
  }

  getDeviceId(): string {
    let deviceId = this.storageService.getString(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = this.createDeviceId();
    }
    return deviceId;
  }

  private createDeviceId(): string {
    const deviceId = crypto.randomUUID();
    this.storageService.set(STORAGE_KEYS.DEVICE_ID, deviceId);
    return deviceId;
  }

  private ensureDeviceId(): void {
    if (!this.storageService.getString(STORAGE_KEYS.DEVICE_ID)) {
      this.createDeviceId();
    }
  }

  getDeviceInfo(): DeviceInfo {
    const uaData = (navigator as any).userAgentData;
    let platform = 'unknown';
    let userAgent = navigator.userAgent;

    if (uaData) {
      platform = uaData.platform || 'unknown';
      if (uaData.brands) {
        userAgent = uaData.brands.map((b: any) => `${b.brand} ${b.version}`).join(', ');
      }
    }

    return {
      deviceId: this.getDeviceId(),
      platform,
      userAgent
    };
  }

  getDeviceInfoString(): string {
    const info = this.getDeviceInfo();
    return `Platform: ${info.platform}, UA: ${info.userAgent}`;
  }

  async registerDevice(profileId: string, fcmToken: string): Promise<any> {
    const deviceId = this.getDeviceId();

    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .upsert({
          profile_id: profileId,
          device_id: deviceId,
          fcm_token: fcmToken,
          device_info: this.getDeviceInfoString(),
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id,device_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Device registered successfully');
      return data;
    } catch (error) {
      console.error('Error registering device:', error);
      return null;
    }
  }

  async unregisterDevice(profileId: string): Promise<boolean> {
    const deviceId = this.getDeviceId();

    try {
      const { error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .delete()
        .match({ profile_id: profileId, device_id: deviceId });

      if (error) throw error;

      console.log('Device unregistered successfully');
      return true;
    } catch (error) {
      console.error('Error unregistering device:', error);
      return false;
    }
  }

  async unregisterAllDevicesForProfile(profileId: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.getAdminClient()
        .schema('porton')
        .from('user_devices')
        .delete()
        .eq('profile_id', profileId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error unregistering all devices for profile:', error);
      return false;
    }
  }

  async getDevicesForProfile(profileId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .select('*')
        .eq('profile_id', profileId);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching devices for profile:', error);
      return [];
    }
  }
}
