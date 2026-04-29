import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/components/app-layout.component';
import { Documentation } from './app/pages/documentation/documentation.component';
import { DailySheetComponent } from './app/pages/daily-sheet/daily-sheet.component';
import { Home } from './app/pages/home/home.component';
import { Teams } from './app/pages/teams/teams.component';
import { WorkGroupDetail } from './app/pages/teams/work-group-detail.component';
import { ReservationsComponent } from './app/pages/reservations/reservations.component';
import { AuthGuard } from './app/core/guards/auth.guard';
import { RoleGuard } from './app/core/guards/role.guard';
import { ArrivalsAndDeparturesPageComponent } from './app/pages/arrivals-and-departures/arrivals-and-departures-page.component';
import { TeamDetailGuard } from './app/core/guards/team-detail.guard';
import { NotesPageComponent } from './app/pages/notes/notes-page.component';
import { StatisticsComponent } from './app/pages/statistics/statistics.component';
import { TaskArchiveComponent } from './app/pages/task-archive/task-archive.component';
import { WorkScheduleComponent } from './app/pages/work-schedule/work-schedule.component';
import { ConsoleMessagesComponent } from './app/pages/console-messages/console-messages.component';
import { ProfileRoles } from './app/core/models/data.models';
import { Login } from './app/pages/auth/login.component';
import { LoginGuard } from './app/core/guards/login.guard';
import { ContentManagementComponent } from './app/pages/content-management/content-management.component';
import { PrivacyPolicyComponent } from './app/pages/privacy-policy/privacy-policy.component';
import { ProfileDetailsComponent } from './app/pages/profile-details/profile-details.component';
import { MapComponent } from './app/pages/map/map.component';

const ALL_STAFF_ROLES = [
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Prodaja,
    ProfileRoles.Recepcija,
    ProfileRoles.Uprava,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.VoditeljKampa,
    ProfileRoles.SavjetnikUprave,
    ProfileRoles.KucniMajstor,
    ProfileRoles.NocnaRecepcija,
    ProfileRoles.Odrzavanje,
    ProfileRoles.KorisnickaSluzba
];

const MANAGEMENT_AND_SALES_ROLES = [
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Prodaja,
    ProfileRoles.Recepcija,
    ProfileRoles.NocnaRecepcija,
    ProfileRoles.Uprava,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.VoditeljKampa,
    ProfileRoles.SavjetnikUprave
];

const DAILY_SHEET_ROLES = [
    ProfileRoles.SavjetnikUprave,
    ProfileRoles.VoditeljKampa,
    ProfileRoles.Uprava,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Prodaja
];

const TEAMS_ROLES = [
    ProfileRoles.KucniMajstor,
    ProfileRoles.SavjetnikUprave,
    ProfileRoles.Uprava,
    ProfileRoles.VoditeljKampa,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.Sobarica,
    ProfileRoles.Terasar,
    ProfileRoles.Odrzavanje,
    ProfileRoles.KorisnickaSluzba,
    ProfileRoles.Recepcija,
    ProfileRoles.NocnaRecepcija
];

const ARRIVALS_AND_DEPARTURES_ROLES = [
    ProfileRoles.KucniMajstor,
    ProfileRoles.VoditeljKampa,
    ProfileRoles.Uprava,
    ProfileRoles.Odrzavanje,
    ProfileRoles.KorisnickaSluzba,
    ProfileRoles.Recepcija,
    ProfileRoles.NocnaRecepcija,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Prodaja
];

export const NOTES_ROLES = [
    ProfileRoles.VoditeljKampa,
    ProfileRoles.Uprava,
    ProfileRoles.KorisnickaSluzba,
    ProfileRoles.Recepcija,
    ProfileRoles.NocnaRecepcija,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.VoditeljRecepcije,
    ProfileRoles.Prodaja
];

const WORK_SCHEDULE_ROLES = [
    ProfileRoles.VoditeljKampa,
    ProfileRoles.Uprava,
    ProfileRoles.VoditeljDomacinstva,
    ProfileRoles.Prodaja,
    ProfileRoles.VoditeljRecepcije
]

const ADMIN_ROLES = [
    ProfileRoles.VoditeljKampa,
    ProfileRoles.Uprava
];

const STATISTICS_ROLES = [
    ProfileRoles.VoditeljKampa
];

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard],
        canActivateChild: [RoleGuard],
        children: [
            {
                path: '',
                component: Home,
                data: { roles: ALL_STAFF_ROLES }
            }, // Default route
            {
                path: 'home',
                component: Home,
                data: { roles: ALL_STAFF_ROLES }
            },
            {
                path: 'reservations',
                component: ReservationsComponent,
                data: { roles: MANAGEMENT_AND_SALES_ROLES }
            },
            {
                path: 'daily-sheet',
                component: DailySheetComponent,
                data: { roles: DAILY_SHEET_ROLES }
            },
            {
                path: 'teams',
                component: Teams,
                data: { roles: TEAMS_ROLES }
            },
            {
                path: 'teams/:id',
                component: WorkGroupDetail,
                data: { roles: TEAMS_ROLES },
                canActivate: [TeamDetailGuard]
            },
            {
                path: 'arrivals-and-departures',
                component: ArrivalsAndDeparturesPageComponent,
                data: { roles: ARRIVALS_AND_DEPARTURES_ROLES }
            },
            {
                path: 'notes',
                component: NotesPageComponent,
                data: { roles: NOTES_ROLES }
            },
            {
                path: 'statistics',
                component: StatisticsComponent,
                data: { roles: STATISTICS_ROLES }
            },
            {
                path: 'archive',
                component: TaskArchiveComponent,
                data: { roles: ADMIN_ROLES }
            },
            {
                path: 'work-schedule',
                component: WorkScheduleComponent,
                // data: { WORK_SCHEDULE_ROLES }
            },
            {
                path: 'console-messages',
                component: ConsoleMessagesComponent,
                data: { roles: ADMIN_ROLES }
            },
            {
                path: 'content-management',
                component: ContentManagementComponent,
                data: { roles: ADMIN_ROLES }
            },
            { path: 'documentation', component: Documentation },
            { path: 'profile-details', component: ProfileDetailsComponent },
            {
                path: 'map',
                component: MapComponent,
                data: { roles: ADMIN_ROLES }
            }
        ]
    },
    { path: 'login', component: Login, canActivate: [LoginGuard] },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: '**', redirectTo: '/' },
];
