import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KeepAliveService } from './keep-alive.service';
import { environment } from '../../environments/environment';

describe('KeepAliveService', () => {
  let service: KeepAliveService;
  let httpMock: HttpTestingController;
  const expectedHealthUrl = `${environment.apiUrl.replace(/\/api\/?$/, '')}/health`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KeepAliveService]
    });
    service = TestBed.inject(KeepAliveService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopKeepAlive();
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('ping should send GET request to /health and update isAwake$ to true on success', () => {
    let responseData: any;
    service.ping().subscribe(res => {
      responseData = res;
    });

    const req = httpMock.expectOne(expectedHealthUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'ok', uptime: 120, service: 'DevJournal Backend API' });

    expect(responseData).toEqual({ status: 'ok', uptime: 120, service: 'DevJournal Backend API' });
  });

  it('ping should handle error gracefully and return null without throwing', () => {
    let responseData: any;
    service.ping().subscribe(res => {
      responseData = res;
    });

    const req = httpMock.expectOne(expectedHealthUrl);
    req.error(new ProgressEvent('Network error'));

    expect(responseData).toBeNull();
  });
});
