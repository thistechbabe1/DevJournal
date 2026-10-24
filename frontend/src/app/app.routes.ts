import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { landingGuard } from './core/guards/landing.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { JournalComponent } from './features/journal/pages/journal-list/journal.component';
import { ChatComponent } from './features/chat/chat.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ViewJournalComponent } from './features/journal/pages/view-journal/view-journal.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
    canActivate: [landingGuard]
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'journal', component: JournalComponent, canActivate: [authGuard] },
  {
    path: 'add-journal',
    loadComponent: () => import('./features/journal/pages/add-journal/add-journal.component').then(m => m.AddJournalComponent),
    canActivate: [authGuard]
  },
  { path: 'view-journal/:id', component: ViewJournalComponent, canActivate: [authGuard] },
  {
    path: 'edit-journal/:id',
    loadComponent: () => import('./features/journal/pages/add-journal/add-journal.component').then(m => m.AddJournalComponent),
    canActivate: [authGuard]
  },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '', pathMatch: 'full' },
];
