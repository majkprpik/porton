import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService, Task, TaskType } from './data.service';
import { Messaging as AngularMessaging  } from '@angular/fire/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  taskTypes: TaskType[] = [];
  
  private fcmTokenSource = new BehaviorSubject<string | null>(null);
  fcmToken$ = this.fcmTokenSource.asObservable();
  
  private messaging = inject(AngularMessaging);
  
  constructor(
    private http: HttpClient,
    private dataService: DataService,
  ) { 
    this.dataService.taskTypes$.subscribe(taskTypes => {
      this.taskTypes = taskTypes;
    });

    onMessage(this.messaging, (payload) => {
      console.log('💬 FCM message received in foreground:', payload);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title ?? 'Notification';
        const notificationOptions = {
          body: payload.notification?.body,
          icon: payload.notification?.icon || '/assets/icons/icon-72x72.png',
        };

        new Notification(notificationTitle, notificationOptions);
      }
    });
  }

  // New method: request permission and get FCM token
  async requestFirebaseMessaging(): Promise<void> {
    try {
      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidPublicKey, 
      });

      if (token) {
        console.log('✅ FCM Token:', token);
        this.setFirebaseMessaingSubscription(token);
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

  async sendTaskCompletedNotification(task: Task){
    const token = localStorage.getItem('supabase_access_token');
    
    if (!token) {
      console.error('No supabase access token found');
      return;
    }

    const fcmToken = this.getFirebaseMessagingSubscription();

    if (fcmToken) {
      this.http.post('https://portonnotifications-l3crl2uwyq-uc.a.run.app/fcm-notifications', 
      {
        fcmToken,
        notification: {
          title: 'Test Notification',
          body: 'Testing',
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

      return;
    }

    const taskType = this.taskTypes.find(taskType => taskType.task_type_id == task.task_type_id);
  }
}
