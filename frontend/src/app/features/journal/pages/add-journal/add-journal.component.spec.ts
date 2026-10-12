import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EditorModule } from '@tinymce/tinymce-angular';
import { AddJournalComponent } from './add-journal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AddJournalComponent', () => {
  let component: AddJournalComponent;
  let fixture: ComponentFixture<AddJournalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [ReactiveFormsModule, RouterTestingModule, EditorModule, AddJournalComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});
    fixture = TestBed.createComponent(AddJournalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
