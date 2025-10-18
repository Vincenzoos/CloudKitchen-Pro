import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RecipeList } from './components/recipe/recipe-list/recipe-list';
import { RecipeAdd } from './components/recipe/recipe-add/recipe-add';
import { RecipeDetail } from './components/recipe/recipe-detail/recipe-detail';
import { RecipeEdit } from './components/recipe/recipe-edit/recipe-edit';
import { AuthGuard } from './guards/auth.guard';

const STUDENT_ID = "33810672";
export const routes: Routes = [
    { path: '', component: Dashboard, canActivate: [AuthGuard] },
    { path: `user/login-${STUDENT_ID}`, component: Login },
    { path: `user/register-${STUDENT_ID}`, component: Register },

    // Recipe routes - all protected by AuthGuard
    { path: `recipe/recipes-${STUDENT_ID}`, component: RecipeList, canActivate: [AuthGuard] },
    { path: `recipe/add-${STUDENT_ID}`, component: RecipeAdd, canActivate: [AuthGuard] },
    { path: `recipe/detail-${STUDENT_ID}/:id`, component: RecipeDetail, canActivate: [AuthGuard] },
    { path: `recipe/edit-${STUDENT_ID}/:id`, component: RecipeEdit, canActivate: [AuthGuard] },

    { path: '**', redirectTo: '' },
];