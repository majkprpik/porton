import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { TaskProgressTypesComponent } from './task-progress-types/task-progress-types.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'task-progress-types', component: TaskProgressTypesComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
