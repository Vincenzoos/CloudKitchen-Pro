import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { AuthGuard } from './guards/auth.guard';

const STUDENT_ID = "33810672";
export const routes: Routes = [
    { path: '', component: Dashboard, canActivate: [AuthGuard] },
    { path: `user/login-${STUDENT_ID}`, component: Login },
    { path: `user/register-${STUDENT_ID}`, component: Register },
    { path: '**', redirectTo: '' },
];