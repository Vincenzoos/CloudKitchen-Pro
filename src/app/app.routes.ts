import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';

export const routes: Routes = [
    { path: 'viet/dashboard', component: Dashboard },
    { path: '', redirectTo: 'viet/dashboard', pathMatch: 'full' },
    { path: '**', component: Dashboard },
];