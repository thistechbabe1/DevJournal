import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ViewJournalComponent } from './view-journal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ViewJournalComponent', () => {
  let component: ViewJournalComponent;
  let fixture: ComponentFixture<ViewJournalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [RouterTestingModule, ViewJournalComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    fixture = TestBed.createComponent(ViewJournalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
