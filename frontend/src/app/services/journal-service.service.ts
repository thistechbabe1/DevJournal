import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Journal } from '../models/journal.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private apiUrl = `${environment.apiUrl}/journals`;

  constructor(private http: HttpClient) {}

  getAllJournals(status?: 'draft' | 'published'): Observable<Journal[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Journal[]>(this.apiUrl, { params });
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
    return this.http.post(this.apiUrl, data);
  }

  updateJournal(id: string, journal: Journal): Observable<Journal> {
    return this.http.put<Journal>(`${this.apiUrl}/${id}`, journal);
  }

  deleteJournal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`${this.apiUrl}/upload-image`, formData);
  }
}
