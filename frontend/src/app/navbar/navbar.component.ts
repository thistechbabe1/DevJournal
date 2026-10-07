import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [CommonModule, RouterModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly isLoggedIn = this.authService.isAuthenticated;
  readonly isCollapsed = signal<boolean>(true);
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      if (!this.isLoggedIn()) {
        this.isCollapsed.set(true);
      }
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isCollapsed.set(true);
      }
    });
  }

  toggleNavbar(): void {
    this.isCollapsed.update(collapsed => !collapsed);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}