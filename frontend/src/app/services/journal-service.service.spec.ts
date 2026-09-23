import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { JournalService } from './journal-service.service';
import { environment } from '../../environments/environment';

describe('JournalService', () => {
  let service: JournalService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/journals`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JournalService]
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

  it('should fetch all journals without query params by default', () => {
    service.getAllJournals().subscribe(journals => {
      expect(journals.length).toBe(2);
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([{ _id: '1', title: 'First' }, { _id: '2', title: 'Second' }]);
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

  it('should create a journal entry', () => {
    const newEntry = { title: 'New Entry', content: 'Some content' };

    service.createJournal(newEntry).subscribe(res => {
      expect(res.title).toBe('New Entry');
    });

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newEntry);
    req.flush({ _id: '456', ...newEntry });
  });

  it('should delete a journal entry by ID', () => {
    service.deleteJournal('123').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
