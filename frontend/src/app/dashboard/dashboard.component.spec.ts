import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../services/auth.service';
import { JournalService } from '../services/journal-service.service';
import { environment } from '../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;
  const journalsApiUrl = `${environment.apiUrl}/journals`;

  beforeEach(() => {
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
});
