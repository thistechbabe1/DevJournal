import { Injectable, computed, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserProfile } from '../models/UserProfile.model';
import { environment } from '../../../environments/environment';

interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private token: string | null = null;

  private readonly _loggedInSignal = signal<boolean>(false);
  private readonly _currentUserProfileSignal = signal<UserProfile | null>(null);

  readonly isAuthenticated = this._loggedInSignal.asReadonly();
  readonly currentUserProfile = this._currentUserProfileSignal.asReadonly();
  readonly userDisplayName = computed(() => {
    const profile = this._currentUserProfileSignal();
    return profile?.name || profile?.email || null;
  });

  private apiURL = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {
    this.loadTokenAndProfile();
  }

  private setLoggedInState(value: boolean): void {
    this._loggedInSignal.set(value);
  }

  private setUserProfileState(profile: UserProfile | null): void {
    this._currentUserProfileSignal.set(profile);
  }

  private loadTokenAndProfile(): void {
    const savedToken = sessionStorage.getItem('token');
    if (savedToken) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(savedToken);
        const isValid = decodedToken.exp ? (decodedToken.exp * 1000 > Date.now()) : true;

        if (isValid) {
          this.token = savedToken;
          this.setLoggedInState(true);
          this.fetchUserProfile().subscribe({
            error: () => {
              this.logout();
            }
          });
        } else {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    } else {
      this.setLoggedInState(false);
      this.setUserProfileState(null);
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiURL}/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http
      .post<{ token: string }>(`${this.apiURL}/auth/login`, data)
      .pipe(
        tap((response) => {
          this.token = response.token;
          sessionStorage.setItem('token', response.token);
          this.setLoggedInState(true);
          this.fetchUserProfile().subscribe({
          });
        })
      );
  }

  logout(): void {
    this.token = null;
    sessionStorage.removeItem('token');
    this.setLoggedInState(false);
    this.setUserProfileState(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getCachedUserEmail(): string | null {
    const currentUser = this._currentUserProfileSignal();
    return currentUser ? currentUser.email : null;
  }

  getCurrentUser(): JwtPayload | null {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<JwtPayload>(token);
        if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
          this.logout();
          return null;
        }
        return decodedToken;
      } catch (error) {
        this.logout();
        return null;
      }
    }
    return null;
  }

  isLoggedInSnapshot(): boolean {
    return this._loggedInSignal();
  }

  getCurrentUserProfileSnapshot(): UserProfile | null {
    return this._currentUserProfileSignal();
  }

  fetchUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiURL}/auth/profile`).pipe(
      tap(profile => this.setUserProfileState(profile)),
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          this.logout();
        }
        return throwError(() => new Error('Failed to fetch user profile'));
      })
    );
  }

  updateProfile(updateData: any): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiURL}/auth/profile`, updateData).pipe(
      tap(profile => this.setUserProfileState(profile)),
      catchError(error => {
        return throwError(() => new Error('Failed to update user profile'));
      })
    );
  }
}