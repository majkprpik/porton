import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorLoggingService {
  private _logs = new BehaviorSubject<string[]>([]);
  private _errors = new BehaviorSubject<string[]>([]);
  private _warnings = new BehaviorSubject<string[]>([]);

  logs$ = this._logs.asObservable();
  errors$ = this._errors.asObservable();
  warnings$ = this._warnings.asObservable();

  logMessage(msg: any) {
    const formatted = this.stringify(msg);
    this._logs.next([...this._logs.getValue(), formatted]);
  }

  logError(error: any) {
    const message = this.stringify(error);
    const current = this._errors.getValue();
    this._errors.next([...current, message]);
  }

  logWarning(warning: any) {
    const message = this.stringify(warning);
    const current = this._warnings.getValue();
    this._warnings.next([...current, message]);
  }

  private stringify(error: any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack}`;
    }

    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch (e) {
      return String(error);
    }
  }

  clear() {
    this._logs.next([]);
    this._warnings.next([]);
    this._errors.next([]);
  }
}
