import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService, Profile, Task } from './data.service';
import { Messaging as AngularMessaging  } from '@angular/fire/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private fcmTokenSource = new BehaviorSubject<string | null>(null);
  fcmToken$ = this.fcmTokenSource.asObservable();
  profiles: Profile[] = [];
  
  private messaging = inject(AngularMessaging);
  
  constructor(
    private http: HttpClient,
    private supabaseService: SupabaseService,
    private dataService: DataService,
  ) { 
    this.dataService.profiles$.subscribe(profiles => {
      this.profiles = profiles;
    })

    onMessage(this.messaging, (payload) => {
      console.log('💬 FCM message received in foreground:', payload);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title ?? 'Notification';
        const notificationOptions = {
          body: payload.notification?.body,
          icon: payload.notification?.icon || '/assets/icons/icon-72x72.png',
        };

        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.showNotification(notificationTitle, notificationOptions);
          } else {
            console.warn('No service worker registration available');
          }
        });
      }
    });
  }

  async requestFirebaseMessaging(): Promise<void> {
    const permission = Notification.permission;

    if (permission === 'denied') {
      console.warn('🚫 Notifications have been blocked by the user.');
      return;
    }

    if (permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        console.warn('🚫 User did not grant notification permission.');
        return;
      }
    }

    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidPublicKey, 
      });

      if (token) {
        console.log('✅ FCM Token:', token);
        this.setFirebaseMessaingSubscription(token);
        this.storeUserDeviceData();
      } else {
        console.warn('⚠️ No FCM token received. Permission denied?');
      }
    } catch (error) {
      console.error('🚫 Error getting FCM token', error);
    }
  }

  setFirebaseMessaingSubscription(token: any){
    this.fcmTokenSource.next(token);
  }

  getFirebaseMessagingSubscription(){
    return this.fcmTokenSource.getValue();
  }

  async sendNotification(profileId: string, notification: { title: string; body: string; icon?: string }){
    const token = await this.supabaseService.getSession();

    if (!token) {
      console.error('No supabase access token found');
      return;
    }

    const userDeviceData = await this.getUserDeviceData(profileId);
    if(!userDeviceData || userDeviceData.length == 0) {
      const profile = this.profiles.find(profile => profile.id == profileId);
      console.error('User ' + (profile?.first_name ?? profileId) + ' has no registered devices');
      return;
    }

    userDeviceData.forEach((device: any) => {
      this.http.post('https://portonnotifications-l3crl2uwyq-uc.a.run.app/fcm-notifications', 
      {
        fcmToken: device.fcm_token,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/assets/icons/icon-72x72.png'
        },
      }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).subscribe({
        next: () => console.log('FCM notification sent!'),
        error: err => console.error('Failed to send FCM notification', err),
      });
    });
  }

  async getUserDeviceData(profileId: string){
    try{
      const { data, error } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .select('*')
        .eq('profile_id', profileId);
      
      if (error) {
        console.error('Error fetching data:', error.message);
        return null;
      }
  
      return data;
    } catch (error){
      console.error('Error fetching user device data:', error);
      return null;
    }
  }

  async storeUserDeviceData(){
    const storedUserId = localStorage.getItem('profileId');
    if(!storedUserId) {
      console.error('User ID not found!');
      return;
    }

    const fcmToken = this.getFirebaseMessagingSubscription();
    if(!fcmToken){
      console.error('FCM token not found while storing user data!');
      return;
    }

    let deviceId = this.getDeviceId();
    if(!deviceId){
      this.createDeviceId();
      deviceId = this.getDeviceId();
    }

    try{
      const { data: userDeviceData, error: storeUserDeviceDataError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .upsert({
          profile_id: storedUserId,
          device_id: deviceId,
          fcm_token: fcmToken,
          device_info: this.getDeviceInfo(),
          last_updated: this.supabaseService.formatDateTimeForSupabase(new Date()),
          created_at: this.supabaseService.formatDateTimeForSupabase(new Date()),
        }, {
          onConflict: 'profile_id,device_id'
        })
        .select()
        .single();

      if(storeUserDeviceDataError) throw storeUserDeviceDataError

      return userDeviceData;
    } catch (error){
      console.error('Error storing user device data:', error);
      return false;
    }
  }

  async deleteUserDeviceData(profileId: string, deviceId: string){
    try{
      const { data: userDeviceData, error: deleteUserDeviceDataError } = await this.supabaseService.getClient()
        .schema('porton')
        .from('user_devices')
        .delete()
        .match({ profile_id: profileId, device_id: deviceId });
  
      if(deleteUserDeviceDataError) throw deleteUserDeviceDataError;
  
      return true;
    } catch(error){
      console.error('Error deleting user device data:', error);
      return false;
    }
  }

  getDeviceId(){
    return localStorage.getItem('porton_device_id');
  }

  createDeviceId(){
    localStorage.setItem('porton_device_id', crypto.randomUUID());
  }

  getDeviceInfo(): string {
    const uaData = (navigator as any).userAgentData;

    if (uaData && uaData.brands) {
      const brands = uaData.brands.map((b: any) => `${b.brand} ${b.version}`).join(', ');
      const platform = uaData.platform || 'unknown';
      return `Brands: ${brands}, Platform: ${platform}`;
    }

    return `UA: ${navigator.userAgent}`;
  }
}
