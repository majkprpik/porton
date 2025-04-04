import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Reservations } from './app/pages/reservations/reservations';
// import { Tasks } from './app/pages/tasks/tasks';
import { DailySheetComponent } from './app/pages/daily-sheet/daily-sheet';
export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: 'reservations', component: Reservations },
            // { path: 'tasks', component: Tasks },
            { path: 'daily-sheet', component: DailySheetComponent },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' },
];
