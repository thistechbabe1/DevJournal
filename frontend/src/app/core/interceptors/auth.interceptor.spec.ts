import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { appConfig } from '../../app.config';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    sessionStorage.clear();
    httpMock.verify();
  });

  it('should add Authorization Bearer header when token is in sessionStorage', () => {
    sessionStorage.setItem('token', 'test-jwt-token-xyz');

    http.get('/api/journals').subscribe();

    const req = httpMock.expectOne('/api/journals');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token-xyz');
    req.flush([]);
  });

  it('should not add Authorization header when no token in sessionStorage', () => {
    sessionStorage.removeItem('token');

    http.get('/api/journals').subscribe();

    const req = httpMock.expectOne('/api/journals');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should attach Authorization header when configured via production appConfig.providers', () => {
    TestBed.resetTestingModule();
    sessionStorage.setItem('token', 'app-config-jwt-123');

    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting()
      ],
    });

    const appHttp = TestBed.inject(HttpClient);
    const appHttpMock = TestBed.inject(HttpTestingController);

    appHttp.get('/api/journals').subscribe();

    const req = appHttpMock.expectOne('/api/journals');
    expect(req.request.headers.get('Authorization')).toBe('Bearer app-config-jwt-123');
    req.flush([]);
    appHttpMock.verify();
  });
});

