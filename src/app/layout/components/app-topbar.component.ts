import { Component, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app-configurator.component';
import { LayoutService } from '../services/layout.service';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { AuthService } from '../../core/services/auth.service';
import { ButtonModule } from 'primeng/button';
import { Profile, ProfileRole } from '../../core/models/data.models';
import { LanguageService } from '../../core/services/language.service';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ProfileService } from '../../core/services/profile.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        RouterModule, 
        CommonModule, 
        StyleClassModule, 
        AppConfigurator, 
        MenuModule,
        ButtonModule,
        FormsModule,
        SelectButtonModule,
    ],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <p-selectbutton
                    [options]="languageService.languages"
                    [(ngModel)]="selectedLanguageCode"
                    optionLabel="name"
                    optionValue="code"
                    (onChange)="changeLanguage()"
                    [allowEmpty]="false"
                    styleClass="language-switcher"
                />
            
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <div class="relative">
                <button
                    class="logged-user p-button-secondary"
                    pButton
                    (click)="openLoggedUserDetails()"
                >
                    <i class="pi pi-user"></i>
                </button>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    @ViewChild('menu') menu!: Menu;
    items!: MenuItem[];
    userMenuItems: MenuItem[] = [
        {
            label: 'Logout',
            icon: 'pi pi-sign-out',
            command: () => {
                this.authService.logout();
            }
        }
    ];
    profiles: Profile[] = [];
    profileRoles: ProfileRole[] = [];
    storedUserId: string | null = '';

    selectedLanguageCode: string = '';
    
    private destroy$ = new Subject<void>();

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService,
        public confirmationService: ConfirmationService,
        private dataService: DataService,
        public languageService: LanguageService,
        public profileService: ProfileService,
    ) {}

    ngOnInit() {
        this.subscribeToProfileData();
    }

    private subscribeToProfileData() {
        combineLatest([
            this.languageService.$selectedLanguage,
            this.dataService.profiles$.pipe(nonNull()),
            this.dataService.profileRoles$.pipe(nonNull()),
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([selectedLanguage, profiles, profileRoles]) => {
                this.storedUserId = this.authService.getStoredUserId();
                this.selectedLanguageCode = selectedLanguage.code;
                this.profiles = profiles.filter(p => !p.is_deleted);
                this.profileRoles = profileRoles;
            },
            error: (error) => {
                console.error('Error in combineLatest:', error);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    changeLanguage(){
        const language = this.languageService.languages.find(l => l.code === this.selectedLanguageCode);
        this.languageService.setLanguage(language, true);
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    openLoggedUserDetails() {    
        this.layoutService.$showLoggedUserDetailsWindow.next(true);
    }
}
