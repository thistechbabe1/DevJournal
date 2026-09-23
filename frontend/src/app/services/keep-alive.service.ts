import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface BackendHealth {
  status: string;
  uptime?: number;
  timestamp?: string;
  service?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KeepAliveService {
  private healthUrl: string;
  private isAwakeSubject = new BehaviorSubject<boolean>(false);
  public isAwake$ = this.isAwakeSubject.asObservable();

  // 14 minutes in milliseconds (Render free tier spins down after 15 minutes of inactivity)
  private readonly PING_INTERVAL_MS = 14 * 60 * 1000;
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor(private http: HttpClient, private ngZone: NgZone) {
    const baseApi = environment.apiUrl.replace(/\/api\/?$/, '');
    this.healthUrl = `${baseApi}/health`;
  }

  /**
   * Starts immediate warm-up ping and sets up recurring pings every 14 minutes.
   * Runs interval outside Angular zone so it doesn't trigger unneeded change detection cycles.
   */
  startKeepAlive(): void {
    // Immediate warm-up ping
    this.ping().subscribe();

    if (this.timerId) {
      clearInterval(this.timerId);
    }

    this.ngZone.runOutsideAngular(() => {
      this.timerId = setInterval(() => {
        this.ping().subscribe();
      }, this.PING_INTERVAL_MS);
    });
  }

  /**
   * Stops the keep-alive interval timer.
   */
  stopKeepAlive(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Sends a GET /health request to wake up or check backend health status.
   */
  ping(): Observable<BackendHealth | null> {
    return this.http.get<BackendHealth>(this.healthUrl).pipe(
      map(res => {
        this.isAwakeSubject.next(true);
        return res;
      }),
      catchError(() => {
        this.isAwakeSubject.next(false);
        return of(null);
      })
    );
  }
}
