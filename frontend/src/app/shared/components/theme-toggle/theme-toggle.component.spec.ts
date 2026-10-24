import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [ThemeService]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');
    fixture.detectChanges();
  });

  it('should create the theme toggle component', () => {
    expect(component).toBeTruthy();
  });

  it('should show moon icon in light mode and have aria-label "Switch to dark theme"', () => {
    const button = fixture.nativeElement.querySelector('.btn-theme-toggle');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark theme');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    const icon = button.querySelector('i');
    expect(icon.classList.contains('bi-moon')).toBeTrue();
  });

  it('should toggle theme when clicked and update attributes and icon', () => {
    const button = fixture.nativeElement.querySelector('.btn-theme-toggle');
    button.click();
    fixture.detectChanges();

    expect(themeService.theme()).toBe('dark');
    expect(button.getAttribute('aria-label')).toBe('Switch to light theme');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    const icon = button.querySelector('i');
    expect(icon.classList.contains('bi-sun')).toBeTrue();
  });
});
