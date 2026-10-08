import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { JournalComponent } from './journal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { environment } from '../../environments/environment';

describe('JournalComponent', () => {
  let component: JournalComponent;
  let fixture: ComponentFixture<JournalComponent>;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/journals`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, JournalComponent],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(JournalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const req = httpMock.expectOne(apiUrl);
    req.flush([]);
    expect(component).toBeTruthy();
  });

  it('should derive filtered lists and counts via computed() signals when view or sort changes', () => {
    const req = httpMock.expectOne(apiUrl);
    req.flush([
      {
        _id: '1',
        title: 'Alpha Entry',
        content: 'Content A',
        category: 'Backend',
        tags: ['node'],
        date: '2026-10-01T00:00:00.000Z',
        status: 'published'
      },
      {
        _id: '2',
        title: 'Beta Draft',
        content: 'Content B',
        category: 'Frontend',
        tags: ['angular'],
        date: '2026-10-05T00:00:00.000Z',
        status: 'draft'
      }
    ]);

    expect(component.totalEntriesCount()).toBe(2);
    expect(component.publishedEntriesCount()).toBe(1);
    expect(component.draftEntriesCount()).toBe(1);
    expect(component.journalEntries().length).toBe(2);
    // Default sort is date desc, so Beta Draft (Oct 5) comes first
    expect(component.journalEntries()[0]._id).toBe('2');

    // Filter to published only
    component.setCurrentView('published');
    expect(component.journalEntries().length).toBe(1);
    expect(component.journalEntries()[0]._id).toBe('1');

    // Filter to drafts only
    component.setCurrentView('drafts');
    expect(component.journalEntries().length).toBe(1);
    expect(component.journalEntries()[0]._id).toBe('2');

    // Back to all and sort by tag (asc -> 'angular' before 'node')
    component.setCurrentView('all');
    component.sortJournals('tag');
    expect(component.journalEntries()[0].tags?.[0]).toBe('angular');

    // Sort by tag again toggles to desc ('node' before 'angular')
    component.sortJournals('tag');
    expect(component.journalEntries()[0].tags?.[0]).toBe('node');
  });
});
