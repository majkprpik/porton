import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { PushNotification, Profile } from '../models/data.models';
import { Messaging as AngularMessaging } from '@angular/fire/messaging';
import { deleteToken, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import { DataService } from './data.service';
import { DeviceService } from './device.service';
import { StorageService, STORAGE_KEYS } from './storage.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private storageService = inject(StorageService);
  private fcmTokenSource = new BehaviorSubject<string | null>(this.getStoredFcmToken());
  fcmToken$ = this.fcmTokenSource.asObservable();

  private profiles: Profile[] = [];
  private messaging = inject(AngularMessaging);

  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
    private dataService: DataService,
    private deviceService: DeviceService,
  ) {
    this.dataService.profiles$
      .pipe(nonNull())
      .subscribe(profiles => {
        this.profiles = profiles.filter(p => !p.is_deleted);
      });

    this.setupForegroundMessageHandler();
  }

  private setupForegroundMessageHandler(): void {
    onMessage(this.messaging, (payload) => {
      console.log('FCM message received in foreground:', payload);

      if (
        document.visibilityState === 'visible' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        const title = payload.notification?.title ?? 'Notification';
        const options = {
          body: payload.notification?.body,
          icon: payload.notification?.icon || '/assets/icons/porton-icon-72x72.png',
        };

        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.showNotification(title, options);
          }
        });
      }
    });
  }

  async requestPermissionAndGetToken(profileId: string): Promise<string | null> {
    if (this.getFcmToken()) {
      await this.deviceService.registerDevice(profileId, this.getFcmToken()!);
      return this.getFcmToken();
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      console.warn('Notifications have been blocked by the user.');
      return null;
    }

    if (permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        console.warn('User did not grant notification permission.');
        return null;
      }
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidPublicKey,
      });

      if (token) {
        console.log('FCM Token obtained');
        this.setFcmToken(token);
        await this.deviceService.registerDevice(profileId, token);
        return token;
      } else {
        console.warn('No FCM token received.');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    try {
      const deleted = await deleteToken(this.messaging);
      if (deleted) {
        this.clearStoredFcmToken();
        console.log('FCM token deleted');
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }

  getFcmToken(): string | null {
    return this.fcmTokenSource.getValue();
  }

  private setFcmToken(token: string): void {
    this.storageService.set(STORAGE_KEYS.FCM_TOKEN, token);
    this.fcmTokenSource.next(token);
  }

  private getStoredFcmToken(): string | null {
    return this.storageService.getString(STORAGE_KEYS.FCM_TOKEN);
  }

  private clearStoredFcmToken(): void {
    this.storageService.remove(STORAGE_KEYS.FCM_TOKEN);
    this.fcmTokenSource.next(null);
  }

  async sendNotification(profileId: string, notification: PushNotification): Promise<void> {
    const token = await this.supabaseService.getAccessToken();

    if (!token) {
      console.error('No supabase access token found');
      return;
    }

    const devices = await this.deviceService.getDevicesForProfile(profileId);
    if (!devices.length) {
      const profile = this.profiles.find(p => p.id === profileId);
      console.error('User ' + (profile?.first_name ?? profileId) + ' has no registered devices');
      return;
    }

    //problem je sto u pola loopa mozes zatvorit aplikaciju i pola notifikacija se nece poslat
    //bolje je poslat listu uredaja i nek se na backendu radi ovo
    const requests = devices.map(device =>
      firstValueFrom(
        this.http.post(
          'https://portonnotifications-l3crl2uwyq-uc.a.run.app/fcm-notifications',
          {
            fcmToken: device.fcm_token,
            notification: {
              title: notification.title,
              body: notification.body,
              icon: '/assets/icons/porton-icon-72x72.png'
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )
      )
    );

    const results = await Promise.allSettled(requests);

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Failed for device ${devices[i].fcm_token}`, result.reason);
      }
    });
  }
}
