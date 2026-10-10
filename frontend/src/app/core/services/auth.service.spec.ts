import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [AuthService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register a new user', () => {
    const userData = { name: 'Alice', email: 'alice@example.com', password: 'password123' };

    service.register(userData).subscribe(res => {
      expect(res.message).toBe('Registration successful');
    });

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(userData);
    req.flush({ message: 'Registration successful', token: 'mock-jwt-token' });
  });

  it('should login user, save token to sessionStorage, and update auth & profile signals', () => {
    const loginCredentials = { email: 'alice@example.com', password: 'password123' };
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUserProfile()).toBeNull();
    expect(service.userDisplayName()).toBeNull();

    service.login(loginCredentials).subscribe(res => {
      expect(res.token).toBe('mock-token');
      expect(sessionStorage.getItem('token')).toBe('mock-token');
    });

    const loginReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ token: 'mock-token', message: 'Login successful' });
    expect(service.isAuthenticated()).toBeTrue();

    const profileReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(profileReq.request.method).toBe('GET');
    profileReq.flush({ _id: '1', name: 'Alice', email: 'alice@example.com', createdAt: '2026-01-01', updatedAt: '2026-01-01' });
    expect(service.currentUserProfile()?.name).toBe('Alice');
    expect(service.userDisplayName()).toBe('Alice');
  });

  it('should logout and clear token and profile signals', () => {
    sessionStorage.setItem('token', 'sample-token');
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isLoggedInSnapshot()).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUserProfileSnapshot()).toBeNull();
    expect(service.currentUserProfile()).toBeNull();
    expect(service.userDisplayName()).toBeNull();
  });
});
