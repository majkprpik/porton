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
                data: { roles: ['Voditelj recepcije', 'Prodaja', 'Recepcija', 'Uprava', 'Voditelj domacinstva', 'Voditelj kampa', 'Savjetnik uprave', 'Kucni majstor', 'Nocna recepcija', 'Odrzavanje', 'Korisnicka sluzba'] }
            }, // Default route
            {   
                path: 'home', 
                component: Home,
                data: { roles: ['Voditelj recepcije', 'Prodaja', 'Recepcija', 'Uprava', 'Voditelj domacinstva', 'Voditelj kampa', 'Savjetnik uprave', 'Kucni majstor', 'Nocna recepcija', 'Odrzavanje', 'Korisnicka sluzba'] }
            },
            { 
                path: 'reservations-2', 
                component: Reservation2Component,
                data: { roles: ['Voditelj recepcije', 'Prodaja', 'Recepcija', 'Uprava', 'Voditelj domacinstva', 'Voditelj kampa', 'Savjetnik uprave'] }
            },
            { 
                path: 'profiles', 
                component: ProfilesComponent,
                data: { roles: ['Voditelj kampa', 'Uprava'] }
            },
            { 
                path: 'daily-sheet', 
                component: DailySheetComponent,
                data: { roles: ['Savjetnik uprave', 'Voditelj kampa', 'Uprava', 'Voditelj domacinstva'] }
            },
            { 
                path: 'teams', 
                component: Teams,
                data: { roles: ['Kucni majstor', 'Savjetnik uprave', 'Uprava', 'Voditelj kampa', 'Voditelj domacinstva', 'Sobarica', 'Terasar', 'Odrzavanje', 'Korisnicka sluzba'] },
                canActivate: [TeamsGuard]
            },
            { 
                path: 'teams/:id', 
                component: WorkGroupDetail,
                data: { roles: ['Kucni majstor', 'Savjetnik uprave', 'Uprava', 'Voditelj kampa', 'Voditelj domacinstva', 'Sobarica', 'Terasar', 'Odrzavanje', 'Korisnicka sluzba'] },
                canActivate: [TeamDetailGuard]
            },
            { 
                path: 'task-progress-types', 
                component: TaskProgressTypesComponent,
                data: { roles: ['Voditelj kampa', 'Uprava'] }
            },
            { 
                path: 'house-types', 
                component: HouseTypesComponent,
                data: { roles: ['Voditelj kampa', 'Uprava'] }
            },
            {
                path: 'arrivals-and-departures',
                component: ArrivalsAndDeparturesPageComponent,
                data: { roles: ['Kucni majstor', 'Voditelj kampa', 'Uprava', 'Odrzavanje', 'Korisnicka sluzba'] }
            },
            {
                path: 'notes',
                component: NotesPageComponent,
                data: { roles: ['Kucni majstor', 'Voditelj kampa', 'Uprava', 'Odrzavanje', 'Korisnicka sluzba'] }
            },
            {
                path: 'statistics',
                component: StatisticsComponent,
                data: { roles: ['Voditelj kampa', 'Uprava'] }
            },
            {
                path: 'archive',
                component: TaskArchiveComponent,
                data: { roles: ['Voditelj kampa', 'Uprava'] }
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
