import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class LoginGuard implements CanActivate {
    constructor(
        private supabaseService: SupabaseService,
        private router: Router
    ) {}

    async canActivate() {
        if (await this.supabaseService.isUserLoggedIn()) {
            this.router.navigate(['/']);
            return false;
        }
        return true;
    }
} 