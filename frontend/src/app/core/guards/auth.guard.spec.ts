import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from '../../../environments/environment';

describe('authGuard', () => {
  let authServiceSpy: { isAuthenticated: jasmine.Spy };
  let router: Router;

  beforeEach(() => {
    authServiceSpy = {
      isAuthenticated: jasmine.createSpy('isAuthenticated')
    };

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should allow activation when user is logged in', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should block activation and redirect to /login when user is not logged in', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('Page refresh simulation with real AuthService', () => {
    let httpMock: HttpTestingController;

    function createValidToken(): string {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({
        id: 'user-refresh-1',
        email: 'refresh@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      return `${header}.${payload}.signature`;
    }

    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it('should allow activation on page refresh when token is present in sessionStorage before AuthService is constructed', () => {
      sessionStorage.setItem('token', createValidToken());

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        providers: [
          AuthService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      });

      httpMock = TestBed.inject(HttpTestingController);
      const realRouter = TestBed.inject(Router);
      spyOn(realRouter, 'navigate');

      // Instantiate AuthService with token already in sessionStorage
      const authService = TestBed.inject(AuthService);
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      req.flush({ _id: 'user-refresh-1', name: 'Refresh User', email: 'refresh@example.com' });

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
      );

      expect(authService.isAuthenticated()).toBeTrue();
      expect(result).toBeTrue();
      expect(realRouter.navigate).not.toHaveBeenCalled();
      httpMock.verify();
    });

    it('should block activation and redirect to /login on page refresh when no token is present in sessionStorage', () => {
      sessionStorage.removeItem('token');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RouterTestingModule],
        providers: [
          AuthService,
          provideHttpClient(withInterceptorsFromDi()),
          provideHttpClientTesting()
        ]
      });

      httpMock = TestBed.inject(HttpTestingController);
      const realRouter = TestBed.inject(Router);
      spyOn(realRouter, 'navigate');

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
      );

      expect(result).toBeFalse();
      expect(realRouter.navigate).toHaveBeenCalledWith(['/login']);
      httpMock.expectNone(`${environment.apiUrl}/auth/profile`);
      httpMock.verify();
    });
  });
});
