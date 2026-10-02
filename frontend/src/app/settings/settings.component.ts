import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JournalService } from '../services/journal-service.service';
import { Journal } from '../models/journal.model';
import { UserProfile } from '../models/UserProfile.model';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterModule]
})
export class SettingsComponent implements OnInit, OnDestroy {
  userName: string = '';
  userEmail: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  isLoggedIn: boolean = false;

  aiAssistantEnabled: boolean = true;
  profileMessage: string | null = null;
  profileMessageClass: string = '';
  aiSettingsMessage: string | null = null;
  aiSettingsMessageClass: string = '';
  exportMessage: string | null = null;
  exportMessageClass: string = '';

  private authSubscription!: Subscription;
  private profileSubscription!: Subscription;
  isUpdatingProfile: boolean = false;

  constructor(
    private authService: AuthService,
    private journalService: JournalService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.profileSubscription = this.authService.currentUserProfile$.subscribe(
      (profile: UserProfile | null) => {
        if (profile) {
          this.userName = profile.name || '';
          this.userEmail = profile.email || '';
        } else {
          this.router.navigate(['/login']);
        }
        this.currentPassword = '';
        this.newPassword = '';
      },
      (error: HttpErrorResponse) => {
        this.profileMessage = error.error?.message || 'Failed to load profile data.';
        this.profileMessageClass = 'message-error';
        if (error.status === 401 || error.status === 403) {
            this.router.navigate(['/login']);
        }
      }
    );

    if (!this.authService.isLoggedInSnapshot() || !this.authService.getCurrentUserProfileSnapshot()) {
      this.authService.fetchUserProfile().subscribe({
          error: () => {
              this.router.navigate(['/login']);
          }
      });
    }

    this.authSubscription = this.authService.isLoggedIn().subscribe(status => {
      this.isLoggedIn = status;
      if (!status) {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
  }

  updateProfile(): void {
    this.profileMessage = null;
    this.isUpdatingProfile = true;

    const updateData: any = {};
    const currentProfile = this.authService.getCurrentUserProfileSnapshot();

    if (currentProfile && this.userName !== currentProfile.name) {
        updateData.name = this.userName;
    }

    if (currentProfile && this.userEmail !== currentProfile.email) {
      updateData.email = this.userEmail;
      if (!this.currentPassword) {
        this.profileMessage = 'Current password is required to change your email.';
        this.profileMessageClass = 'message-error';
        this.isUpdatingProfile = false;
        return;
      }
    }

    if (this.newPassword) {
      updateData.newPassword = this.newPassword;
      if (!this.currentPassword) {
        this.profileMessage = 'Current password is required to set a new password.';
        this.profileMessageClass = 'message-error';
        this.isUpdatingProfile = false;
        return;
      }
    }

    if (this.currentPassword) {
        updateData.currentPassword = this.currentPassword;
    }

    if (Object.keys(updateData).length === 0) {
      this.profileMessage = 'No changes to save.';
      this.profileMessageClass = 'message-info';
      this.isUpdatingProfile = false;
      return;
    }

    this.authService.updateProfile(updateData).subscribe({
      next: (response) => {
        this.profileMessage = (response as any).message || 'Profile updated successfully!';
        this.profileMessageClass = 'message-success';
        this.currentPassword = '';
        this.newPassword = '';
        this.isUpdatingProfile = false;
      },
      error: (err: HttpErrorResponse) => {
        this.profileMessage = err.error?.message || 'Failed to update profile. Please try again.';
        this.profileMessageClass = 'message-error';
        this.isUpdatingProfile = false;
      }
    });
  }

  toggleAiSettings(): void {
    this.aiSettingsMessage = null;
    this.aiSettingsMessage = `AI Assistant ${this.aiAssistantEnabled ? 'enabled' : 'disabled'} (functionality not yet fully wired).`;
    this.aiSettingsMessageClass = 'message-info';
  }
}