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
    let raw: string;

    if (error instanceof Error) {
      raw = `${error.name}: ${error.message}\n${error.stack}`;
    } else {
      try {
        raw = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
      } catch (e) {
        raw = String(error);
      }
    }

    return this.redact(raw);
  }

  private redact(text: string): string {
    // JWT tokens (three base64url segments separated by dots)
    text = text.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '[JWT_REDACTED]');
    // Bearer tokens in Authorization headers
    text = text.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]');
    // Supabase anon/service keys (long base64-like strings after "apikey" or "key")
    text = text.replace(/(apikey|api_key|service_role|anon)["\s:=]+[A-Za-z0-9\-._~+/]{20,}/gi, '$1: [REDACTED]');
    // Generic long base64 strings that look like tokens (40+ chars, no spaces)
    text = text.replace(/[A-Za-z0-9+/]{40,}={0,2}/g, '[REDACTED]');
    return text;
  }

  clear() {
    this._logs.next([]);
    this._warnings.next([]);
    this._errors.next([]);
  }
}
