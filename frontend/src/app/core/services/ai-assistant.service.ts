import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private apiUrl = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) { }

  sendMessage(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}/chat`, { message });
  }

  getJournalInsights(journalContent: string): Observable<{ insights: string }> {
    return this.http.post<{ insights: string }>(`${this.apiUrl}/journal-insights`, { journalEntryContent: journalContent });
  }
}