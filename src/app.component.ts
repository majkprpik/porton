import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from './app/core/services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule, ProgressSpinnerModule],
    template: `
        <router-outlet></router-outlet>
        @if (authService.isAuthLoading$ | async) {
            <div class="auth-loading-overlay">
                <p-progressSpinner strokeWidth="4" animationDuration="1s"></p-progressSpinner>
            </div>
        }
    `,
    styles: [`
        .auth-loading-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            pointer-events: all;
        }
    `]
})
export class AppComponent {
    constructor(public authService: AuthService) {}
}
