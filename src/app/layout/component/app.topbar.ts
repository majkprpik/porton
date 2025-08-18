import { Component, ViewChild } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { AuthService } from '../../pages/service/auth.service';
import { ButtonModule } from 'primeng/button';
import { Language, Profile, ProfileRole } from '../../pages/service/data.models';
import { LanguageService } from '../../pages/language/language.service';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ProfileService } from '../../pages/service/profile.service';
import { PushNotificationsService } from '../../pages/service/push-notifications.service';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../pages/service/supabase.service';
import { DataService } from '../../pages/service/data.service';

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
        SelectModule,
    ],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <p-select 
                    [options]="languageService.languages" 
                    [(ngModel)]="selectedLanguage" 
                    optionLabel="name"
                    (onChange)="changeLanguage()"
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
                    iconPos="right"
                    (click)="confirm1($event)"
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

    selectedLanguage: Language = { code: '', name: ''};
    
    private destroy$ = new Subject<void>();

    constructor(
        public layoutService: LayoutService,
        public authService: AuthService,
        public confirmationService: ConfirmationService,
        private dataService: DataService,
        public languageService: LanguageService,
        public profileService: ProfileService,
        private pushNotificationService: PushNotificationsService,
        private supabaseService: SupabaseService,
    ) {}

    ngOnInit() {
        this.subscribeToProfileData();
    }

    private subscribeToProfileData() {
        combineLatest([
            this.languageService.$selectedLanguage,
            this.dataService.profiles$,
            this.dataService.profileRoles$
        ])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
            next: ([selectedLanguage, profiles, profileRoles]) => {
                this.storedUserId = this.authService.getStoredUserId();
                this.selectedLanguage = selectedLanguage;
                this.profiles = profiles;
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
        this.languageService.setLanguage(this.selectedLanguage, true);
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    async confirm1(event: Event) {    
        const userId = this.authService.getStoredUserId();
        const profile = this.profiles.find(p => p.id == userId);
        const email = this.authService.getStoredUsername() || '';
        const name = profile ? `${profile.first_name} ${profile.last_name ? profile.last_name : ''}` : '';
        const phone = profile?.phone_number || '';
        const role = this.profileRoles.find(profileRole => profileRole.id == profile?.role_id)?.name || '';

        if(profile && profile.first_name == 'Test User2'){
            this.confirmationService.confirm({
                target: event.target as EventTarget,
                header: 'Profil',
                message: 
                    `<div style="max-width: 400px;">
                        <div class="new-profile-row"><b>Ime:</b> ${name}</div>
                        <div class="new-profile-row"><b>Email:</b> ${email}</div>
                        <div class="new-profile-row"><b>Mobitel:</b> ${phone}</div>
                        <div class="new-profile-row"><b>Pozicija:</b> ${role}</div>
                        <div class="new-profile-row"><b>Access token:</b> ${await this.supabaseService.getAccessToken()}</div>
                        <div class="new-profile-row"><b>fcmToken:</b> ${this.pushNotificationService.getFirebaseMessagingSubscription()}</div> 
                    </div>`,
                acceptButtonProps: {
                    label: 'Odjava',
                    severity: 'danger',
                },
                rejectVisible: false,
                accept: () => {
                    this.authService.logout();
                }
            });
        } else {
            this.confirmationService.confirm({
                target: event.target as EventTarget,
                header: 'Profil',
                message: 
                    `<div class="new-profile-row"><b>Ime:</b> ${name}</div>` +
                    `<div class="new-profile-row"><b>Email:</b> ${email}</div>` +
                    `<div class="new-profile-row"><b>Mobitel:</b> ${phone}</div>` +
                    `<div class="new-profile-row"><b>Pozicija:</b> ${role}</div>`,
                acceptButtonProps: {
                    label: 'Odjava',
                    severity: 'danger',
                },
                rejectVisible: false,
                accept: () => {
                    this.authService.logout();
                }
            });
        }

    }
}
