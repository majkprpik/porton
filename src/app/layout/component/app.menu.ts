import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../pages/service/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit, OnDestroy {
    model: MenuItem[] = [];
    private userProfile: any;
    private subscription: Subscription;

    constructor(private authService: AuthService) {
        this.subscription = this.authService.userProfile.subscribe(profile => {
            this.userProfile = profile;
            this.buildMenu();
        });
    }

    ngOnInit() {
        this.buildMenu();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private isRoleAllowedForPregled(role?: string): boolean {
        if (!role) return false;
        
        const allowedRoles = [
            'kucni_majstor', 
            'odrzavanje',
            'voditelj_recepcije',
            'prodaja',
            'recepcija',
            'nocni_recepcioner',
            'customer_service',
            'voditelj_kampa',
            'savjetnik_uprave',
            'voditelj_domacinstva'
        ];
        
        return allowedRoles.includes(role);
    }

    private isRoleAllowedForRezervacije2(role?: string): boolean {
        if (!role) return false;
        
        const allowedRoles = [
            'voditelj_recepcije',
            'prodaja',
            'recepcija',
            'voditelj_domacinstva',
            'voditelj_kampa',
            'savjetnik_uprave'
        ];
        
        return allowedRoles.includes(role);
    }

    private isVoditeljKampa(role?: string): boolean {
        return role === 'voditelj_kampa';
    }

    private canViewTimovi(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = [
            'kucni_majstor', 
            'savjetnik_uprave',
            'voditelj_kampa',
            'voditelj_domacinstva'
        ];

        return allowedRoles.includes(role);
    }

    private canViewDnevniList(role?: string): boolean {
        if (!role) return false;
        
        const allowedRoles = [
            'savjetnik_uprave',
            'voditelj_kampa',
            'voditelj_domacinstva'
        ];
        
        return allowedRoles.includes(role);
    }

    private buildMenu() {
        // get from local storage
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) {
            return;
        }
        const userRole = JSON.parse(userProfile).role;
        // Base menu items (visible to all)
        const menuItems = [];
        
        // Items that need role check
        if (this.isRoleAllowedForPregled(userRole)) {
            menuItems.push({ label: 'Pregled', icon: 'pi pi-fw pi-home', routerLink: ['/home'] });
        }
        
        // Conditionally add Rezervacije 2
        if (this.isRoleAllowedForRezervacije2(userRole)) {
            menuItems.push({ label: 'Rezervacije', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/reservations-2'] });
        }

        if(this.canViewTimovi(userRole)){
            menuItems.push({ label: 'Timovi', icon: 'pi pi-fw pi-users', routerLink: ['/teams'] });
        }

        if(this.canViewDnevniList(userRole)){
            menuItems.push({ label: 'Dnevni list', icon: 'pi pi-fw pi-file', routerLink: ['/daily-sheet'] });
        }
        
        // Add voditelj_kampa only menu items
        if (this.isVoditeljKampa(userRole)) {
            menuItems.push(
                { label: 'Profili', icon: 'pi pi-fw pi-user', routerLink: ['/profiles'] },
                { label: 'Statusi zadataka', icon: 'pi pi-fw pi-check-square', routerLink: ['/task-progress-types'] },
                { label: 'Tipovi kuća', icon: 'pi pi-fw pi-home', routerLink: ['/house-types'] }
            );
        }
        
        this.model = [
            {
                items: menuItems
            }
        ];
    }
}
