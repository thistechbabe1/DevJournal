import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JournalService } from '../services/journal-service.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [FormsModule, RouterModule]
})
export class SettingsComponent implements OnInit {
  userName = signal<string>('');
  userEmail = signal<string>('');
  currentPassword = signal<string>('');
  newPassword = signal<string>('');

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUserProfile = this.authService.currentUserProfile;

  aiAssistantEnabled = signal<boolean>(true);
  profileMessage = signal<string | null>(null);
  profileMessageClass = signal<string>('');
  aiSettingsMessage = signal<string | null>(null);
  aiSettingsMessageClass = signal<string>('');
  exportMessage = signal<string | null>(null);
  exportMessageClass = signal<string>('');
  isUpdatingProfile = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private journalService: JournalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const cached = this.currentUserProfile();
    if (cached) {
      this.userName.set(cached.name || '');
      this.userEmail.set(cached.email || '');
    } else {
      this.authService.fetchUserProfile().subscribe({
        next: (profile) => {
          this.userName.set(profile.name || '');
          this.userEmail.set(profile.email || '');
        },
        error: () => {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  updateProfile(): void {
    this.profileMessage.set(null);
    this.isUpdatingProfile.set(true);

    const updateData: any = {};
    const currentProfile = this.currentUserProfile();

    const nameVal = this.userName().trim();
    const emailVal = this.userEmail().trim();
    const currPassVal = this.currentPassword();
    const newPassVal = this.newPassword();

    if (currentProfile && nameVal !== currentProfile.name) {
      updateData.name = nameVal;
    }

    if (emailVal && (!currentProfile || emailVal !== currentProfile.email)) {
      updateData.email = emailVal;
      if (!currPassVal) {
        this.profileMessage.set('Current password is required to change your email.');
        this.profileMessageClass.set('message-error');
        this.isUpdatingProfile.set(false);
        return;
      }
    }

    if (newPassVal) {
      updateData.newPassword = newPassVal;
      if (!currPassVal) {
        this.profileMessage.set('Current password is required to set a new password.');
        this.profileMessageClass.set('message-error');
        this.isUpdatingProfile.set(false);
        return;
      }
    }

    if (currPassVal) {
      updateData.currentPassword = currPassVal;
    }

    if (Object.keys(updateData).length === 0) {
      this.profileMessage.set('No changes to save.');
      this.profileMessageClass.set('message-info');
      this.isUpdatingProfile.set(false);
      return;
    }

    this.authService.updateProfile(updateData).subscribe({
      next: (response: any) => {
        this.profileMessage.set(response?.message || 'Profile updated successfully!');
        this.profileMessageClass.set('message-success');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.isUpdatingProfile.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.profileMessage.set(err.error?.message || 'Failed to update profile. Please try again.');
        this.profileMessageClass.set('message-error');
        this.isUpdatingProfile.set(false);
      }
    });
  }

  toggleAiSettings(): void {
    this.aiSettingsMessage.set(
      `AI Assistant ${this.aiAssistantEnabled() ? 'enabled' : 'disabled'} (functionality not yet fully wired).`
    );
    this.aiSettingsMessageClass.set('message-info');
  }
}