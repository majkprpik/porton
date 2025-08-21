import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/components/app.layout';
import { Documentation } from './app/pages/documentation/documentation';
import { Notfound } from './app/pages/notfound/notfound';
import { DailySheetComponent } from './app/pages/daily-sheet/daily-sheet';
import { Home } from './app/pages/home/home';
import { Teams } from './app/pages/teams/teams';
import { WorkGroupDetail } from './app/pages/teams/work-group-detail';
import { Reservation2Component } from './app/pages/reservations/reservations.component';
import { AuthGuard } from './app/core/guards/auth.guard';
import { RoleGuard } from './app/core/guards/role.guard';
import { ProfilesComponent } from './app/pages/profiles/profiles.component';
import { ArrivalsAndDeparturesPageComponent } from './app/pages/arrivals-and-departures/arrivals-and-departures-page.component';
import { TeamsGuard } from './app/core/guards/teams.guard';
import { TeamDetailGuard } from './app/core/guards/team-detail.guard';
import { NotesPageComponent } from './app/pages/notes/notes-page.component';
import { StatisticsComponent } from './app/pages/statistics/statistics.component';
import { TaskArchiveComponent } from './app/pages/task-archive/task-archive.component';
import { WorkScheduleComponent } from './app/pages/work-schedule/work-schedule.component';
import { ConsoleMessagesComponent } from './app/pages/console-messages/console-messages.component';
import { ProfileRoles } from './app/core/models/data.models';
import { Login } from './app/pages/auth/login';
import { LoginGuard } from './app/core/guards/login.guard';

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
                path: 'reservations', 
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
                    ProfileRoles.VoditeljKampa,
                    ProfileRoles.Uprava,
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
            { path: 'documentation', component: Documentation },
        ]
    },
    { path: 'login', component: Login, canActivate: [LoginGuard] },
    { path: '**', redirectTo: '/' }
];
