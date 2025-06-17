import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DataService, Task, TaskType } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private subscriptionSource = new BehaviorSubject<PushSubscriptionJSON | null>(null);
  subscription$ = this.subscriptionSource.asObservable();
  taskTypes: TaskType[] = [];
  
  constructor(
    private http: HttpClient,
    private dataService: DataService,
  ) { 
    this.dataService.taskTypes$.subscribe(taskTypes => {
      this.taskTypes = taskTypes;
    });
  }


  setSubscription(sub: PushSubscriptionJSON) {
    this.subscriptionSource.next(sub);
  }

  getSubscription(): PushSubscriptionJSON | null {
    return this.subscriptionSource.getValue();
  }

  async sendTaskCompletedNotification(task: Task){
    const token = localStorage.getItem('supabase_access_token');
    
    if (!token) {
      console.error('No supabase access token found');
      return;
    }

    const sub = this.getSubscription();
    const taskType = this.taskTypes.find(taskType => taskType.task_type_id == task.task_type_id);
    
    if (!sub) {
      console.error('No push subscription available');
      return;
    }

    this.http.post('https://portonnotifications-l3crl2uwyq-uc.a.run.app/porton-notifications',
    {
      subscription: sub,
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
    }).subscribe(() => {
      console.log('Notification sent!');
    });
  }
}
