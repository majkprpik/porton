import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkGroupService {
  private activeGroupIdSubject = new BehaviorSubject<number | undefined>(undefined);
  activeGroupId$ = this.activeGroupIdSubject.asObservable();

  setActiveGroup(groupId: number | undefined) {
    this.activeGroupIdSubject.next(groupId);
  }

  getActiveGroup(): number | undefined {
    return this.activeGroupIdSubject.value;
  }
} 