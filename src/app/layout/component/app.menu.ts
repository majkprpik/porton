import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { ProfileRole, ProfileRoles } from '../../pages/service/data.models';
import { ProfileService } from '../../pages/service/profile.service';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../../pages/service/data.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for(item of model; track item.badge; let i = $index){
            @if(!item.separator){
                <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    profileRoles: ProfileRole[] = [];
    
    private destroy$ = new Subject<void>();

    constructor(
        private dataService: DataService,
        private profileService: ProfileService,
        private translateService: TranslateService,
    ) {}

    ngOnInit() {
        this.subscribeToDataStreams();
        this.subscribeToProfileForLocalStorage();
        this.subscribeToLangChange();
    }

    private subscribeToDataStreams() {
        combineLatest([
            this.dataService.profileRoles$,
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([profileRoles]) => {
                this.profileRoles = profileRoles;
                if (this.profileRoles.length > 0) {
                    this.buildMenu();
                }
            },
            error: (error) => {
                console.error(error);
            }
        });
    }

    private subscribeToProfileForLocalStorage() {
        this.profileService.$profileForLocalStorage
        .pipe(takeUntil(this.destroy$))
        .subscribe(profile => {
            if (profile) {
                this.buildMenu();
            }
        });
    }

    private subscribeToLangChange() {
        this.translateService.onLangChange
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
            this.buildMenu();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private isRoleAllowedForPregled(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.KucniMajstor ||
            profileRole.name == ProfileRoles.Odrzavanje ||
            profileRole.name == ProfileRoles.VoditeljRecepcije ||
            profileRole.name == ProfileRoles.Prodaja ||
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.NocnaRecepcija ||
            profileRole.name == ProfileRoles.KorisnickaSluzba ||
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.SavjetnikUprave ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva
        );
        
        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private isRoleAllowedForRezervacije2(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.VoditeljRecepcije || 
            profileRole.name == ProfileRoles.Prodaja || 
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva || 
            profileRole.name == ProfileRoles.VoditeljKampa || 
            profileRole.name == ProfileRoles.SavjetnikUprave
        );
        
        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private isVoditeljKampa(role?: string): boolean {
        return role === ProfileRoles.VoditeljKampa || role === ProfileRoles.Uprava;
    }

    private canViewTimovi(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.KucniMajstor || 
            profileRole.name == ProfileRoles.Odrzavanje || 
            profileRole.name == ProfileRoles.SavjetnikUprave || 
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.VoditeljKampa || 
            profileRole.name == ProfileRoles.VoditeljDomacinstva ||
            profileRole.name == ProfileRoles.Terasar ||
            profileRole.name == ProfileRoles.KorisnickaSluzba ||
            profileRole.name == ProfileRoles.Sobarica
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewArrivalsAndDepartures(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.KucniMajstor || 
            profileRole.name == ProfileRoles.Odrzavanje || 
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.KorisnickaSluzba ||
            profileRole.name == ProfileRoles.Uprava
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewNotes(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.KucniMajstor || 
            profileRole.name == ProfileRoles.Odrzavanje || 
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.KorisnickaSluzba
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewSchedule(role?: string): boolean {
        if(!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.Uprava || 
            profileRole.name == ProfileRoles.VoditeljDomacinstva || 
            profileRole.name == ProfileRoles.VoditeljRecepcije || 
            profileRole.name == ProfileRoles.Prodaja
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewDnevniList(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole => 
            profileRole.name == ProfileRoles.SavjetnikUprave ||
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva
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
            menuItems.push({ label: this.translateService.instant('MENU.HOME'), icon: 'pi pi-fw pi-home', routerLink: ['/home'] });
        }
        
        // Conditionally add Rezervacije 2
        if (this.isRoleAllowedForRezervacije2(userRole?.name)) {
            menuItems.push({ label: this.translateService.instant('MENU.RESERVATIONS'), icon: 'pi pi-fw pi-calendar-plus', routerLink: ['/reservations-2'] });
        }

        if(this.canViewTimovi(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.TEAMS'), icon: 'pi pi-fw pi-users', routerLink: ['/teams'] });
        }

        if(this.canViewDnevniList(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.DAILY-SHEET'), icon: 'pi pi-fw pi-file', routerLink: ['/daily-sheet'] });
        }

        if(this.canViewArrivalsAndDepartures(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.ARRIVALS-AND-DEPARTURES'), icon: 'pi pi-arrow-right-arrow-left', routerLink: ['/arrivals-and-departures'] });
        }

        if(this.canViewNotes(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.NOTES'), icon: 'pi pi-clipboard', routerLink: ['/notes'] });
        }

        if(this.canViewSchedule(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.WORK-SCHEDULE'), icon: 'pi pi-calendar-clock', routerLink: ['/work-schedule'] });
        }

        // Add Voditelj kampa only menu items
        if (this.isVoditeljKampa(userRole?.name)) {
            menuItems.push(
                { label: this.translateService.instant('MENU.PROFILES'), icon: 'pi pi-fw pi-user', routerLink: ['/profiles'] },
                { label: this.translateService.instant('MENU.STATISTICS'), icon: 'pi pi-chart-bar', routerLink: ['/statistics'] },
                { label: this.translateService.instant('MENU.ARCHIVE'), icon: 'pi pi-book', routerLink: ['/archive'] },
                { label: this.translateService.instant('MENU.CONSOLE-MESSAGES'), icon: 'pi pi-bullseye', routerLink: ['/console-messages'] },
            );
        }
        
        this.model = [
            {
                items: menuItems
            }
        ];
    }
}
