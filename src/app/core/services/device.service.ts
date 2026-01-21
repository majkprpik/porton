import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  userAgent: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly DEVICE_ID_KEY = 'porton_device_id';

  constructor(private supabaseService: SupabaseService) {
    this.ensureDeviceId();
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = this.createDeviceId();
    }
    return deviceId;
  }

  private createDeviceId(): string {
    const deviceId = crypto.randomUUID();
    localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    return deviceId;
  }

  private ensureDeviceId(): void {
    if (!localStorage.getItem(this.DEVICE_ID_KEY)) {
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
