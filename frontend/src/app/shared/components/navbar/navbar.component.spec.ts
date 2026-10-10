import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, NavbarComponent],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.isLoggedIn()).toBeFalse();
    expect(component.isCollapsed()).toBeTrue();
  });

  it('should toggle isCollapsed signal when toggleNavbar is called', () => {
    expect(component.isCollapsed()).toBeTrue();
    component.toggleNavbar();
    expect(component.isCollapsed()).toBeFalse();
    component.toggleNavbar();
    expect(component.isCollapsed()).toBeTrue();
  });
});
