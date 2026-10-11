import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { JournalComponent } from './journal/journal.component';
import { ChatComponent } from './features/chat/chat.component';
import { SettingsComponent } from './features/settings/settings.component';
import { AddJournalComponent } from './journal/add-journal/add-journal.component';
import { ViewJournalComponent } from './journal/view-journal/view-journal.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'journal', component: JournalComponent, canActivate: [authGuard] },
  { path: 'add-journal', component: AddJournalComponent, canActivate: [authGuard] },
  { path: 'view-journal/:id', component: ViewJournalComponent, canActivate: [authGuard] },
  { path: 'edit-journal/:id', component: AddJournalComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'dashboard', pathMatch: 'full' },
];
