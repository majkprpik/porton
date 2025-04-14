import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Reservations } from './app/pages/reservations/reservations';
// import { Tasks } from './app/pages/tasks/tasks';
import { DailySheetComponent } from './app/pages/daily-sheet/daily-sheet';
import { Home } from './app/pages/home/home';
import { Teams } from './app/pages/teams/teams';
import { WorkGroupDetail } from './app/pages/teams/work-group-detail';
import { Reservation2Component } from './app/pages/reservation-2/reservation-2.component';
import { AuthGuard } from './app/layout/guard/auth.guard';
import { ProfilesComponent } from './app/pages/profiles/profiles.component';
import { TaskProgressTypesComponent } from './app/pages/task-progress-types/task-progress-types.component';
import { HouseTypesComponent } from './app/pages/house-types/house-types.component';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [AuthGuard],
        children: [
            { path: '', component: Home }, // Default route
            { path: 'home', component: Home },
            { path: 'reservations', component: Reservations },
            { path: 'reservations-2', component: Reservation2Component },
            // { path: 'tasks', component: Tasks },
            { path: 'profiles', component: ProfilesComponent },
            { path: 'daily-sheet', component: DailySheetComponent },
            { path: 'teams', component: Teams },
            { path: 'teams/:id', component: WorkGroupDetail },
            { path: 'task-progress-types', component: TaskProgressTypesComponent },
            { path: 'house-types', component: HouseTypesComponent },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    // { path: 'landing', component: Landing, canActivate: [AuthGuard] },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
