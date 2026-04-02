import { Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../services/layout.service';
import { ButtonModule } from 'primeng/button';
import { DataService } from '../../core/services/data.service';
import { ProfileService } from '../../core/services/profile.service';
import { StorageService, STORAGE_KEYS } from '../../core/services/storage.service';
import { TranslateService } from '@ngx-translate/core';
import { Profile, ProfileRole, ProfileRoles } from '../../core/models/data.models';
import { combineLatest, filter, Subject, takeUntil } from 'rxjs';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { NavigationEnd, Router } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="layout-sidebar">
            <div class="sidebar-content">
                <div
                    class="menu-item"
                    *ngFor="let item of model; let i = index"
                    [class.active]="selectedItem === i"
                    (click)="selectItem(i); navigateTo(item.routerLink[0])"
                >
                    <i class="menu-icon" [ngClass]="item.icon"></i>
                    <span class="menu-text">{{ item.label }}</span>
                </div>
            </div>
            <div class="sidebar-footer">
                <div class="settings" (click)="openSettings()" role="button" tabindex="0">
                    <i class="settings-icon pi pi-cog"></i>
                    <span class="settings-text">Settings</span>
                </div>
            </div>
        </div>

        <nav class="bottom-nav">
            <div
                class="bottom-nav-item"
                *ngFor="let item of model; let i = index"
                [class.active]="selectedItem === i"
                (click)="selectItem(i); navigateTo(item.routerLink[0])"
                [style.display]="item.hideOnMobile ? 'none' : ''"
            >
                <i [ngClass]="item.icon"></i>
            </div>
            <div class="bottom-nav-item" (click)="openSettings()">
                <i class="pi pi-cog"></i>
            </div>
        </nav>
    `,
    styles: [`
        .layout-sidebar {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            width: 5rem;
            height: 100vh;
            z-index: 999;
            padding: 0.5rem 0.75rem;
            user-select: none;
            overflow-x: hidden;
            overflow-y: auto;
            border-radius: 0;
            transition: width 0.3s ease,
                        transform var(--layout-section-transition-duration),
                        left var(--layout-section-transition-duration),
                        var(--glass-transition);

            .sidebar-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                overflow-x: hidden;
                overflow-y: auto;
            }

            .menu-item {
                box-sizing: border-box;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem 1rem;
                cursor: pointer;
                border-radius: var(--content-border-radius);
                border: 1px solid transparent;
                transition: background 0.2s, border-color 0.2s;

                &:hover {
                    background: var(--glass-bg-hover);
                    border-color: var(--glass-border-accent);

                    .menu-icon,
                    .menu-text {
                        transform: scale(1.02);
                    }
                }

                &.active {
                    font-weight: bold;
                    color: var(--primary-color);
                    background: linear-gradient(135deg, #6366f126, #3b82f61a);
                    border-color: var(--glass-border-accent);
                }

                .menu-icon,
                .menu-text {
                    transition: transform 0.2s ease;
                }
            }

            .menu-icon {
                font-size: 1.35rem;
                min-width: 1.35rem;
                color: var(--glass-text-secondary);
                transition: margin 0.3s ease, font-size 0.3s ease;
            }

            .menu-text {
                opacity: 0;
                width: 0;
                overflow: hidden;
                white-space: nowrap;
                transition: opacity 0.2s ease, width 0.2s ease;
            }

            .sidebar-footer {
                margin-top: auto;
                border-top: 1px solid var(--surface-border);
                overflow-x: hidden;
                height: 60px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                .settings {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 1rem;
                    width: 100%;
                    border-radius: var(--content-border-radius);
                    cursor: pointer;
                    white-space: nowrap;
                    overflow: hidden;
                    color: var(--glass-text-primary);
                    border: 1px solid transparent;
                    transition: var(--glass-transition);

                    .settings-icon {
                        font-size: 1.35rem;
                        min-width: 1.35rem;
                        margin-right: 0;
                        color: var(--glass-text-secondary);
                        transition: margin 0.3s ease, font-size 0.3s ease;
                    }

                    .settings-text {
                        opacity: 0;
                        width: 0;
                        overflow: hidden;
                        white-space: nowrap;
                        transition: opacity 0.2s ease, width 0.2s ease;
                    }

                    &:hover {
                        background: var(--glass-bg-hover);
                    }
                }
            }
        }

        @media (max-width: 991px) {
            .layout-sidebar {
                display: none;
            }
        }

        .layout-sidebar:hover,
        .layout-sidebar:focus-within {
            width: 250px;

            .menu-text {
                opacity: 1;
                width: 100%;
            }

            .sidebar-footer{
                .settings{
                    .settings-text {
                        opacity: 1;
                        width: 100%;
                    }
                }
            }

            .sidebar-footer .layout-menuitem-text {
                opacity: 1;
                width: auto;
            }
        }
        .bottom-nav {
            display: none;
        }

        @media (max-width: 991px) {
            .bottom-nav {
                display: flex;
                flex-direction: row;
                align-items: center;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 64px;
                z-index: 999;
                background: var(--glass-bg);
                backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
                border-top: 1px solid var(--glass-border);
                box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
                padding-bottom: env(safe-area-inset-bottom);
                overflow-x: auto;
                overflow-y: hidden;
                scroll-snap-type: x proximity;
                -webkit-overflow-scrolling: touch;

                /* Hide scrollbar but keep scroll functionality */
                scrollbar-width: none;
                &::-webkit-scrollbar {
                    display: none;
                }

                .bottom-nav-item {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    min-width: 68px;
                    padding: 0 14px;
                    cursor: pointer;
                    color: var(--glass-text-secondary);
                    transition: color 0.2s;
                    scroll-snap-align: center;
                    border-radius: 12px;
                    margin: 6px 2px;

                    i {
                        font-size: 1.4rem !important;
                    }

                    &.active {
                        color: var(--primary-color);
                        background: linear-gradient(135deg, #6366f126, #3b82f61a);
                        border: 1.5px solid var(--glass-border-accent);
                        box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
                    }

                    &:active {
                        opacity: 0.7;
                    }
                }
            }
        }
    `]
})
export class AppSidebar {
    model: any[] = [];
    profileRoles: ProfileRole[] = [];
    profiles: Profile[] = [];
    selectedItem: number | null = null;
    
    private destroy$ = new Subject<void>();

    constructor(
        public el: ElementRef,
        private layoutService: LayoutService,
        private dataService: DataService,
        private profileService: ProfileService,
        private storageService: StorageService,
        private translateService: TranslateService,
        private router: Router,
    ) {}

    ngOnInit() {
        this.subscribeToDataStreams();
        this.subscribeToProfileForLocalStorage();
        this.subscribeToLangChange();
        this.subscribeToRouteChanges();
    }

    private subscribeToRouteChanges() {
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this.destroy$)
            )
            .subscribe(() => {
                this.updateSelectedItemFromRoute();
            });
    }

    openSettings() {
        this.layoutService.$showLoggedUserDetailsWindow.next(true);
    }

    private subscribeToDataStreams() {
        combineLatest([
            this.dataService.profileRoles$.pipe(nonNull()),
            this.dataService.profiles$.pipe(nonNull()),
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([profileRoles, profiles]) => {
                this.profileRoles = profileRoles;
                this.profiles = profiles;

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

    private isRoleAllowedForRezervacije(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole =>
            profileRole.name == ProfileRoles.VoditeljRecepcije ||
            profileRole.name == ProfileRoles.Prodaja ||
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.NocnaRecepcija ||
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
            profileRole.name == ProfileRoles.Sobarica ||
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.NocnaRecepcija
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
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.NocnaRecepcija ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewNotes(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole =>
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.KorisnickaSluzba ||
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.Recepcija ||
            profileRole.name == ProfileRoles.NocnaRecepcija ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private canViewSchedule(role?: string): boolean {
        if (!role) return false;

        // All roles can access work-schedule (restricted users see only their own row)
        return !!this.profileRoles.find(pr => pr.name == role);
    }

    private canViewDnevniList(role?: string): boolean {
        if (!role) return false;

        const allowedRoles = this.profileRoles.filter(profileRole =>
            profileRole.name == ProfileRoles.SavjetnikUprave ||
            profileRole.name == ProfileRoles.VoditeljKampa ||
            profileRole.name == ProfileRoles.Uprava ||
            profileRole.name == ProfileRoles.VoditeljDomacinstva ||
            profileRole.name == ProfileRoles.VoditeljRecepcije ||
            profileRole.name == ProfileRoles.Prodaja
        );

        return allowedRoles.some(allowedRole => allowedRole.name == role);
    }

    private buildMenu() {
        const userId = this.storageService.getString(STORAGE_KEYS.PROFILE_ID);
        if (!userId) {
            return;
        }

        const userProfile = this.profiles.find(p => p.id == userId);
        if(!userProfile) {
            return;
        }

        const userRole = this.profileRoles.find(profileRole => profileRole.id == userProfile.role_id);

        const menuItems = [];
        
        if (this.isRoleAllowedForPregled(userRole?.name)) {
            menuItems.push({ label: this.translateService.instant('MENU.HOME'), icon: 'pi pi-home', routerLink: ['/home'] });
        }

        if (this.isRoleAllowedForRezervacije(userRole?.name)) {
            menuItems.push({ label: this.translateService.instant('MENU.RESERVATIONS'), icon: 'pi pi-calendar-plus', routerLink: ['/reservations'] });
        }

        if(this.canViewTimovi(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.TEAMS'), icon: 'pi pi-users', routerLink: ['/teams'] });
        }

        if(this.canViewDnevniList(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.DAILY-SHEET'), icon: 'pi pi-file', routerLink: ['/daily-sheet'] });
        }

        if(this.canViewArrivalsAndDepartures(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.ARRIVALS-AND-DEPARTURES'), icon: 'pi pi-arrow-right-arrow-left', routerLink: ['/arrivals-and-departures'] });
        }

        if(this.canViewNotes(userRole?.name)){
            menuItems.push({ label: this.translateService.instant('MENU.NOTES'), icon: 'pi pi-clipboard', routerLink: ['/notes'] });
        }

        menuItems.push({ label: this.translateService.instant('MENU.WORK-SCHEDULE'), icon: 'pi pi-calendar-clock', routerLink: ['/work-schedule'] });

        if (this.isVoditeljKampa(userRole?.name)) {
            menuItems.push(
                { label: this.translateService.instant('MENU.STATISTICS'), icon: 'pi pi-chart-bar', routerLink: ['/statistics'] },
                { label: this.translateService.instant('MENU.ARCHIVE'), icon: 'pi pi-book', routerLink: ['/archive'] },
                { label: this.translateService.instant('MENU.CONSOLE-MESSAGES'), icon: 'pi pi-bullseye', routerLink: ['/console-messages'], hideOnMobile: true },
                { label: this.translateService.instant('MENU.CONTENT-MANAGEMENT'), icon: 'pi pi-microchip', routerLink: ['/content-management'], hideOnMobile: true },
                { label: this.translateService.instant('MENU.3D'), icon: 'fa-solid fa-cubes', routerLink: ['/map'], hideOnMobile: true },
            );
        }
        
        this.model = [...menuItems];
        this.updateSelectedItemFromRoute();
    }

    private updateSelectedItemFromRoute() {
        const currentUrl = this.router.url;
        const index = this.model.findIndex(item => currentUrl.startsWith(item.routerLink[0]));
        if (index !== -1) {
            this.selectedItem = index;
        }
    }

    navigateTo(url: string){
        this.router.navigate([url]);
    }

    selectItem(index: number) {
        this.selectedItem = index;
    }
}
