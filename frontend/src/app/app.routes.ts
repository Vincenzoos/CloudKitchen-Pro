import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';

const STUDENT_ID = "33810672";
export const routes: Routes = [
    { path: `dashboard-${STUDENT_ID}`, component: Dashboard },
    { path: `user/login-${STUDENT_ID}`, component: Login },
    { path: `user/register-${STUDENT_ID}`, component: Register },
    { path: '', redirectTo: `dashboard-${STUDENT_ID}`, pathMatch: 'full' },
    { path: '**', component: Dashboard },
];