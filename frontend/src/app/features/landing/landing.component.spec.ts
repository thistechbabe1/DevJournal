import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, LandingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the landing component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero headline', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heroTitle = compiled.querySelector('.hero-title');
    expect(heroTitle?.textContent).toContain('The Intelligent Logbook for');
  });

  it('should contain links to register and login', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const registerCta = compiled.querySelector('#hero-cta-register');
    const loginCta = compiled.querySelector('#hero-cta-login');
    expect(registerCta).toBeTruthy();
    expect(loginCta).toBeTruthy();
  });

  it('should render all 4 core feature cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.feature-card');
    expect(cards.length).toBe(4);
  });
});
