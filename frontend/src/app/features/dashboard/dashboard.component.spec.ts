import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../core/services/auth.service';
import { JournalService } from '../../services/journal-service.service';
import { environment } from '../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;
  const journalsApiUrl = `${environment.apiUrl}/journals`;

  function createJwt(name: string, email: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      email,
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    return `${header}.${payload}.signature`;
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule, MatSnackBarModule, DashboardComponent],
      providers: [AuthService, JournalService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should create and compute summary statistics from JournalService signals', () => {
    const req = httpMock.expectOne(journalsApiUrl);
    req.flush([
      { _id: '1', title: 'Post 1', status: 'published', createdAt: '2026-10-01' },
      { _id: '2', title: 'Post 2', status: 'draft', createdAt: '2026-10-02' }
    ]);

    expect(component).toBeTruthy();
    expect(component.totalJournals()).toBe(1);
    expect(component.draftCount()).toBe(1);
    expect(component.activities().length).toBe(2);
    expect(component.formattedLastActivityDate()).not.toBe('N/A');
  });

  it('should cycle aiTip when getNewAiTip is clicked', () => {
    const req = httpMock.expectOne(journalsApiUrl);
    req.flush([]);

    const initialTip = component.aiTip();
    expect(initialTip).toBeTruthy();
    component.getNewAiTip();
    expect(component.aiTip()).toBeTruthy();
  });

  it('should not use stale sessionStorage or profile after logout and login as a different user', () => {
    const req = httpMock.expectOne(journalsApiUrl);
    req.flush([]);

    const authService = TestBed.inject(AuthService);

    // 1. User Alice logs in
    const tokenAlice = createJwt('Alice Lawal', 'alice@example.com');
    authService.login({ email: 'alice@example.com', password: 'Password123!' }).subscribe();
    const loginAliceReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    loginAliceReq.flush({ token: tokenAlice });
    const profileAliceReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
    profileAliceReq.flush({ _id: '1', name: 'Alice Lawal', email: 'alice@example.com' });

    expect(component.userName()).toBe('Alice Lawal');

    // 2. User Alice logs out
    authService.logout();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(component.userName()).toBe('User');

    // 3. User Bob logs in
    const tokenBob = createJwt('Bob Smith', 'bob@example.com');
    authService.login({ email: 'bob@example.com', password: 'Password123!' }).subscribe();
    const loginBobReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    loginBobReq.flush({ token: tokenBob });
    const profileBobReq = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
    profileBobReq.flush({ _id: '2', name: 'Bob Smith', email: 'bob@example.com' });

    expect(component.userName()).toBe('Bob Smith');
  });
});
