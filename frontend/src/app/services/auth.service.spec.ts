import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
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

  it('should login user and save token to sessionStorage', () => {
    const loginCredentials = { email: 'alice@example.com', password: 'password123' };

    service.login(loginCredentials).subscribe(res => {
      expect(res.token).toBe('mock-token');
      expect(sessionStorage.getItem('token')).toBe('mock-token');
    });

    const loginReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ token: 'mock-token', message: 'Login successful' });

    const profileReq = httpMock.expectOne(`${apiUrl}/auth/profile`);
    expect(profileReq.request.method).toBe('GET');
    profileReq.flush({ id: '1', name: 'Alice', email: 'alice@example.com' });
  });

  it('should logout and clear token and profile', () => {
    sessionStorage.setItem('token', 'sample-token');
    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.isLoggedInSnapshot()).toBeFalse();
    expect(service.getCurrentUserProfileSnapshot()).toBeNull();
  });
});
