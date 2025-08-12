import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Documentation } from './app/pages/documentation/documentation';
import { Notfound } from './app/pages/notfound/notfound';
import { DailySheetComponent } from './app/pages/daily-sheet/daily-sheet';
import { Home } from './app/pages/home/home';
import { Teams } from './app/pages/teams/teams';
import { WorkGroupDetail } from './app/pages/teams/work-group-detail';
import { Reservation2Component } from './app/pages/reservation-2/reservation-2.component';
import { AuthGuard } from './app/layout/guard/auth.guard';
import { RoleGuard } from './app/layout/guard/role.guard';
import { ProfilesComponent } from './app/pages/profiles/profiles.component';
import { TaskProgressTypesComponent } from './app/pages/task-progress-types/task-progress-types.component';
import { HouseTypesComponent } from './app/pages/house-types/house-types.component';
import { ArrivalsAndDeparturesPageComponent } from './app/layout/component/arrivals-and-departures-page.component';
import { TeamsGuard } from './app/layout/guard/teams.guard';
import { TeamDetailGuard } from './app/layout/guard/team-detail.guard';
import { NotesPageComponent } from './app/layout/component/notes-page.component';
import { StatisticsComponent } from './app/layout/component/statistics.component';
import { TaskArchiveComponent } from './app/layout/component/task-archive.component';
import { WorkScheduleComponent } from './app/layout/component/work-schedule.component';
import { ConsoleMessagesComponent } from './app/layout/component/console-messages.component';
import { ProfileRoles } from './app/pages/service/data.models';

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
                data: { roles: [
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
                ] }
            }, // Default route
            {   
                path: 'home', 
                component: Home,
                data: { roles: [
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
                ] }
            },
            { 
                path: 'reservations-2', 
                component: Reservation2Component,
                data: { roles: [
                    ProfileRoles.VoditeljRecepcije,
                    ProfileRoles.Prodaja,
                    ProfileRoles.Recepcija,
                    ProfileRoles.Uprava,
                    ProfileRoles.VoditeljDomacinstva,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.SavjetnikUprave
                ] }
            },
            { 
                path: 'profiles', 
                component: ProfilesComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            { 
                path: 'daily-sheet', 
                component: DailySheetComponent,
                data: { roles: [
                    ProfileRoles.SavjetnikUprave,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava,
                    ProfileRoles.VoditeljDomacinstva
                ] }
            },
            { 
                path: 'teams', 
                component: Teams,
                data: { roles: [
                    ProfileRoles.KucniMajstor,
                    ProfileRoles.SavjetnikUprave,
                    ProfileRoles.Uprava,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.VoditeljDomacinstva,
                    ProfileRoles.Sobarica,
                    ProfileRoles.Terasar,
                    ProfileRoles.Odrzavanje,
                    ProfileRoles.KorisnickaSluzba
                ] },
                canActivate: [TeamsGuard]
            },
            { 
                path: 'teams/:id', 
                component: WorkGroupDetail,
                data: { roles: [
                    ProfileRoles.KucniMajstor,
                    ProfileRoles.SavjetnikUprave,
                    ProfileRoles.Uprava,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.VoditeljDomacinstva,
                    ProfileRoles.Sobarica,
                    ProfileRoles.Terasar,
                    ProfileRoles.Odrzavanje,
                    ProfileRoles.KorisnickaSluzba
                ] },
                canActivate: [TeamDetailGuard]
            },
            { 
                path: 'task-progress-types', 
                component: TaskProgressTypesComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            { 
                path: 'house-types', 
                component: HouseTypesComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            {
                path: 'arrivals-and-departures',
                component: ArrivalsAndDeparturesPageComponent,
                data: { roles: [
                    ProfileRoles.KucniMajstor,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava,
                    ProfileRoles.Odrzavanje,
                    ProfileRoles.KorisnickaSluzba
                ] }
            },
            {
                path: 'notes',
                component: NotesPageComponent,
                data: { roles: [
                    ProfileRoles.KucniMajstor,
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava,
                    ProfileRoles.Odrzavanje,
                    ProfileRoles.KorisnickaSluzba
                ] }
            },
            {
                path: 'statistics',
                component: StatisticsComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            {
                path: 'archive',
                component: TaskArchiveComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            {
                path: 'work-schedule',
                component: WorkScheduleComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava,
                    ProfileRoles.VoditeljDomacinstva,
                    ProfileRoles.Prodaja,
                    ProfileRoles.VoditeljRecepcije
                ] }
            },
            {
                path: 'console-messages',
                component: ConsoleMessagesComponent,
                data: { roles: [
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava
                ] }
            },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
