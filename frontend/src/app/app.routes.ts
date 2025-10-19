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
import { NotFound } from './components/not-found/not-found';
import { authGuard } from './guards/auth.guard';

const STUDENT_ID = "33810672";
export const routes: Routes = [
    // Home route - protected by authGuard
    { path: '', component: Dashboard, canActivate: [authGuard] },

    // Auth routes
    { path: `user/login-${STUDENT_ID}`, component: Login },
    { path: `user/register-${STUDENT_ID}`, component: Register },

    // Recipe routes - all protected by authGuard
    { path: `recipe/recipes-${STUDENT_ID}`, component: RecipeList, canActivate: [authGuard] },
    { path: `recipe/add-${STUDENT_ID}`, component: RecipeAdd, canActivate: [authGuard] },
    { path: `recipe/detail-${STUDENT_ID}/:id`, component: RecipeDetail, canActivate: [authGuard] },
    { path: `recipe/edit-${STUDENT_ID}/:id`, component: RecipeEdit, canActivate: [authGuard] },

    // Inventory routes - all protected by authGuard
    { path: `inventory/inventories-${STUDENT_ID}`, component: InventoryList, canActivate: [authGuard] },
    { path: `inventory/add-${STUDENT_ID}`, component: InventoryAdd, canActivate: [authGuard] },
    { path: `inventory/edit-${STUDENT_ID}/:id`, component: InventoryEdit, canActivate: [authGuard] },

    // Wildcard route for 404 Not Found page
    { path: '**', component: NotFound },
];