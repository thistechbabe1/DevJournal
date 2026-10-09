import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../services/auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [SettingsComponent, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [AuthService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    authService = TestBed.inject(AuthService);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize signal defaults', () => {
    expect(component).toBeTruthy();
    expect(component.isUpdatingProfile()).toBeFalse();
    expect(component.profileMessage()).toBeNull();
  });

  it('should validate required current password when changing email', () => {
    component.userEmail.set('newemail@example.com');
    component.currentPassword.set('');
    component.updateProfile();

    expect(component.profileMessage()).toBe('Current password is required to change your email.');
    expect(component.profileMessageClass()).toBe('message-error');
  });
});
