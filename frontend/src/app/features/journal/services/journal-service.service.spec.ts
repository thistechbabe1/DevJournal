import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { JournalService } from './journal-service.service';
import { environment } from '../../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('JournalService', () => {
  let service: JournalService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/journals`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JournalService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    service = TestBed.inject(JournalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all journals without query params by default and update signals + computed counts', () => {
    service.getAllJournals().subscribe(journals => {
      expect(journals.length).toBe(2);
    });
    expect(service.isLoading()).toBeTrue();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([
      { _id: '1', title: 'First', content: 'A', status: 'published' },
      { _id: '2', title: 'Second', content: 'B', status: 'draft' }
    ]);

    expect(service.isLoading()).toBeFalse();
    expect(service.totalCount()).toBe(2);
    expect(service.publishedCount()).toBe(1);
    expect(service.draftCount()).toBe(1);
    expect(service.publishedJournals()[0].title).toBe('First');
    expect(service.draftJournals()[0].title).toBe('Second');
  });

  it('should fetch journals with status filter when provided', () => {
    service.getAllJournals('published').subscribe(journals => {
      expect(journals.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}?status=published`);
    expect(req.request.method).toBe('GET');
    req.flush([{ _id: '1', title: 'First' }]);
  });

  it('should fetch single journal by ID', () => {
    service.getJournalById('123').subscribe(journal => {
      expect(journal.title).toBe('Sample');
    });

    const req = httpMock.expectOne(`${apiUrl}/123`);
    expect(req.request.method).toBe('GET');
    req.flush({ _id: '123', title: 'Sample' });
  });

  it('should create a journal entry and prepend it to journals signal', () => {
    const newEntry = { title: 'New Entry', content: 'Some content' };

    service.createJournal(newEntry).subscribe(res => {
      expect(res.title).toBe('New Entry');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newEntry);
    req.flush({ _id: '456', ...newEntry, status: 'published' });

    expect(service.totalCount()).toBe(1);
    expect(service.journals()[0]._id).toBe('456');
  });

  it('should delete a journal entry by ID and remove it from journals signal', () => {
    service.createJournal({ title: 'To Delete', content: 'Body' }).subscribe();
    httpMock.expectOne(apiUrl).flush({ _id: '123', title: 'To Delete', content: 'Body' });
    expect(service.totalCount()).toBe(1);

    service.deleteJournal('123').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.totalCount()).toBe(0);
  });
});
