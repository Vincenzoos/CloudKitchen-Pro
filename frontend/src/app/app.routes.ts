import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { RecipeList } from './components/recipe/recipe-list/recipe-list';
import { RecipeAdd } from './components/recipe/recipe-add/recipe-add';
import { RecipeDetail } from './components/recipe/recipe-detail/recipe-detail';
import { RecipeEdit } from './components/recipe/recipe-edit/recipe-edit';
import { InventoryList } from './components/inventory/inventory-list/inventory-list';
import { InventoryAdd } from './components/inventory/inventory-add/inventory-add';
import { InventoryEdit } from './components/inventory/inventory-edit/inventory-edit';
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

    // Inventory routes - all protected by AuthGuard
    { path: `inventory/inventories-${STUDENT_ID}`, component: InventoryList, canActivate: [AuthGuard] },
    { path: `inventory/add-${STUDENT_ID}`, component: InventoryAdd, canActivate: [AuthGuard] },
    { path: `inventory/edit-${STUDENT_ID}/:id`, component: InventoryEdit, canActivate: [AuthGuard] },

    { path: '**', redirectTo: '' },
];