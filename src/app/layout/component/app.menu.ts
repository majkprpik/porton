import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { combineLatest } from 'rxjs';
import { DataService, ProfileRole } from '../../pages/service/data.service';

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
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    profileRoles: ProfileRole[] = [];

    constructor(
        private dataService: DataService,
    ) {
        
    }

    ngOnInit() {
        combineLatest([
            this.dataService.profileRoles$,
        ]).subscribe({
            next: ([profileRoles]) => {
                this.profileRoles = profileRoles;

                if(this.profileRoles.length > 0){
                    this.buildMenu();
                }
            }, 
            error: (error) => {
                console.error(error);
            }
        });
    }

    private isRoleAllowedForPregled(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == 'Kucni majstor' ||
            profileRole.name == 'Odrzavanje' ||
            profileRole.name == 'Voditelj recepcije' ||
            profileRole.name == 'Prodaja' ||
            profileRole.name == 'Recepcija' ||
            profileRole.name == 'Nocna Recepcija' ||
            profileRole.name == 'Korisnicka sluzba' ||
            profileRole.name == 'Voditelj kampa' ||
            profileRole.name == 'Uprava' ||
            profileRole.name == 'Savjetnik uprave' ||
            profileRole.name == 'Voditelj domacinstva'
        );
        
        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private isRoleAllowedForRezervacije2(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == 'Voditelj recepcije' || 
            profileRole.name == 'Prodaja' || 
            profileRole.name == 'Recepcija' || 
            profileRole.name == 'Uprava' ||
            profileRole.name == 'Voditelj domacinstva' || 
            profileRole.name == 'Voditelj kampa' || 
            profileRole.name == 'Savjetnik uprave'
        );
        
        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private isVoditeljKampa(role?: string): boolean {
        return role === 'Voditelj kampa' || role === 'Uprava';
    }

    private canViewTimovi(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == 'Kucni majstor' || 
            profileRole.name == 'Savjetnik uprave' || 
            profileRole.name == 'Uprava' ||
            profileRole.name == 'Voditelj kampa' || 
            profileRole.name == 'Voditelj domacinstva'
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewDnevniList(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == 'Savjetnik uprave' ||
            profileRole.name == 'Voditelj kampa' ||
            profileRole.name == 'Uprava' ||
            profileRole.name == 'Voditelj domacinstva'
        );
        
        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private buildMenu() {
        // get from local storage
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) {
            return;
        }

        const userRole = this.profileRoles.find(profileRole => profileRole.id == JSON.parse(userProfile).role_id);
        // Base menu items (visible to all)
        const menuItems = [];
        
        // Items that need role check
        if (this.isRoleAllowedForPregled(userRole?.name)) {
            menuItems.push({ label: 'Pregled', icon: 'pi pi-fw pi-home', routerLink: ['/home'] });
        }
        
        // Conditionally add Rezervacije 2
        if (this.isRoleAllowedForRezervacije2(userRole?.name)) {
            menuItems.push({ label: 'Rezervacije', icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/reservations-2'] });
        }

        if(this.canViewTimovi(userRole?.name)){
            menuItems.push({ label: 'Timovi', icon: 'pi pi-fw pi-users', routerLink: ['/teams'] });
        }

        if(this.canViewDnevniList(userRole?.name)){
            menuItems.push({ label: 'Dnevni list', icon: 'pi pi-fw pi-file', routerLink: ['/daily-sheet'] });
        }
        
        // Add Voditelj kampa only menu items
        if (this.isVoditeljKampa(userRole?.name)) {
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
