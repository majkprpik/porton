import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-debug-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(true){
      <div class="debug-overlay">
        <div class="debug-content">
          <h3>Performance Logs</h3>
          @for(log of logs; track log.timestamp){
            <div class="log-entry">
              <span class="timestamp">{{log.timestamp | date:'HH:mm:ss.SSS'}}</span>
              <span class="message">{{log.message}}</span>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .debug-overlay {
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      max-width: 400px;
      max-height: 300px;
      overflow-y: auto;
    }

    .debug-content {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #4CAF50;
    }

    .log-entry {
      display: flex;
      gap: 10px;
    }

    .timestamp {
      color: #9E9E9E;
    }

    .message {
      color: #fff;
    }
  `]
})
export class DebugOverlayComponent implements OnInit, OnDestroy {
  isDevelopment = true;
  logs: { timestamp: Date; message: string }[] = [];
  private logLimit = 50;
  private performanceObserver: PerformanceObserver | null = null;

  ngOnInit() {
    if (this.isDevelopment) {
      this.setupPerformanceObserver();
      this.log('Debug overlay initialized');
    }
  }

  ngOnDestroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }

  private setupPerformanceObserver() {
    this.performanceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.log(`Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure', 'resource'] });
  }

  private log(message: string) {
    this.logs.unshift({
      timestamp: new Date(),
      message
    });

    if (this.logs.length > this.logLimit) {
      this.logs.pop();
    }
  }
} 