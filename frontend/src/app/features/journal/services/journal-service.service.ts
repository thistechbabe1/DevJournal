import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Journal } from '../models/journal.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private apiUrl = `${environment.apiUrl}/journals`;

  private readonly _journalsSignal = signal<Journal[]>([]);
  private readonly _isLoadingSignal = signal<boolean>(false);
  private readonly _errorSignal = signal<string | null>(null);

  readonly journals = this._journalsSignal.asReadonly();
  readonly isLoading = this._isLoadingSignal.asReadonly();
  readonly error = this._errorSignal.asReadonly();

  readonly publishedJournals = computed(() =>
    this._journalsSignal().filter(j => (j.status ?? 'published') === 'published')
  );
  readonly draftJournals = computed(() =>
    this._journalsSignal().filter(j => j.status === 'draft')
  );
  readonly totalCount = computed(() => this._journalsSignal().length);
  readonly publishedCount = computed(() => this.publishedJournals().length);
  readonly draftCount = computed(() => this.draftJournals().length);

  constructor(private http: HttpClient) {}

  private setJournalsState(entries: Journal[]): void {
    const safeEntries = Array.isArray(entries) ? entries : [];
    this._journalsSignal.set(safeEntries);
  }

  getAllJournals(status?: 'draft' | 'published'): Observable<Journal[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    this._isLoadingSignal.set(true);
    this._errorSignal.set(null);
    return this.http.get<Journal[]>(this.apiUrl, { params }).pipe(
      tap({
        next: (entries) => {
          if (!status) {
            this.setJournalsState(entries);
          }
          this._isLoadingSignal.set(false);
        },
        error: () => {
          if (!status) {
            this.setJournalsState([]);
          }
          this._isLoadingSignal.set(false);
          this._errorSignal.set('Failed to load journal entries.');
        }
      })
    );
  }

  getPublishedJournals(): Observable<Journal[]> {
    return this.http.get<Journal[]>(`${this.apiUrl}?status=published`);
  }

  getDraftJournals(): Observable<Journal[]> {
    return this.http.get<Journal[]>(`${this.apiUrl}?status=draft`);
  }

  getJournalById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createJournal(data: any): Observable<any> {
    return this.http.post<Journal>(this.apiUrl, data).pipe(
      tap((created) => {
        if (created && created._id) {
          this.setJournalsState([created, ...this._journalsSignal()]);
        }
      })
    );
  }

  updateJournal(id: string, journal: Journal): Observable<Journal> {
    return this.http.put<Journal>(`${this.apiUrl}/${id}`, journal).pipe(
      tap((updated) => {
        if (updated) {
          this.setJournalsState(
            this._journalsSignal().map(item => (item._id === id ? updated : item))
          );
        }
      })
    );
  }

  deleteJournal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.setJournalsState(
          this._journalsSignal().filter(item => item._id !== id)
        );
      })
    );
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload-image`, formData);
  }
}
