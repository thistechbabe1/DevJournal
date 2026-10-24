import { Component, OnInit, OnDestroy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterModule, ThemeToggleComponent]
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly isLoggedIn = this.authService.isAuthenticated;
  readonly isCollapsed = signal<boolean>(true);
  readonly currentTheme = this.themeService.theme;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
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