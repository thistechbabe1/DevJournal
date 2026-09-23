import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
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
});
