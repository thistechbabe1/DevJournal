import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorModule } from '@tinymce/tinymce-angular';
import { JournalService } from '../../services/journal-service.service';
import { Journal } from '../../models/journal.model';
import { environment } from '../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-add-journal',
    templateUrl: './add-journal.component.html',
    styleUrls: ['./add-journal.component.scss'],
    imports: [ReactiveFormsModule, EditorModule, RouterModule]
})
export class AddJournalComponent implements OnInit {
  journalForm!: FormGroup;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  isSaving: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isEditMode: boolean = false;
  journalId: string | null = null;
  sanitizedBackendContent: SafeHtml | null = null;

  private readonly backendUrl: string = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.journalForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      tags: [''],
      relatedLinks: [''],
      status: ['draft'],
    });

    this.route.paramMap.subscribe((params) => {
      this.journalId = params.get('id');
      if (this.journalId) {
        this.isEditMode = true;
        this.loadJournalData(this.journalId);
      }
    });
  }

  loadJournalData(id: string): void {
    this.isSaving = true;
    this.journalService.getJournalById(id).subscribe({
      next: (journal: Journal) => {
        console.log(
          '%c1. Journal data received from backend:',
          'color: limegreen; font-weight: bold;',
          journal
        );

        if (typeof journal.content === 'string') {
          this.sanitizedBackendContent = this.sanitizer.bypassSecurityTrustHtml(journal.content);
          console.log(
            '%c1b. Sanitized content for diagnostic div (SafeHtml object):',
            'color: purple;',
            this.sanitizedBackendContent
          );
        } else {
          this.sanitizedBackendContent = null;
          console.error('journal.content is not a string for sanitization. Cannot set diagnostic HTML.');
        }

        const formData = {
          title: journal.title,
          content: journal.content,
          category: journal.category,
          date: new Date(journal.date).toISOString().split('T')[0],
          tags: journal.tags ? journal.tags.join(', ') : '',
          relatedLinks: journal.relatedLinks
            ? journal.relatedLinks.join(', ')
            : '',
          status: journal.status || 'draft',
        };

        this.journalForm.reset(formData);
        console.log('%c2. Form model has been reset (TinyMCE should update automatically).', 'color: skyblue;');

        if (journal.imageUrl && !journal.imageUrl.startsWith('http')) {
          this.imageUrl = `${this.backendUrl}${journal.imageUrl}`;
        } else {
          this.imageUrl = journal.imageUrl ?? null;
        }
        this.isSaving = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load journal. Please try again.';
        this.isSaving = false;
      },
    });
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      const reader = new FileReader();
      reader.onload = () => (this.imageUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      const reader = new FileReader();
      reader.onload = () => (this.imageUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onPublish(): void {
    if (this.journalForm.invalid) {
      this.journalForm.markAllAsTouched();
      this.errorMessage = 'Please fill out all required fields to publish.';
      return;
    }
    this.processSave('published');
  }

  onSaveDraft(): void {
    this.processSave('draft');
  }

  private processSave(status: 'published' | 'draft'): void {
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    let journalData: Partial<Journal> = {
      title: this.journalForm.value.title,
      content: this.journalForm.value.content,
      category: this.journalForm.value.category,
      date: this.journalForm.value.date,
      tags: this.journalForm.value.tags
        ? this.journalForm.value.tags
            .split(',')
            .map((tag: string) => tag.trim())
            .filter(Boolean)
        : [],
      relatedLinks: this.journalForm.value.relatedLinks
        ? this.journalForm.value.relatedLinks
            .split(',')
            .map((link: string) => link.trim())
            .filter(Boolean)
        : [],
      status: status,
    };

    const finalizeSave = () => {
      if (this.imageUrl && this.imageUrl.startsWith(this.backendUrl)) {
        journalData.imageUrl = this.imageUrl.replace(this.backendUrl, '');
      } else if (this.imageUrl === null) {
        journalData.imageUrl = '';
      }

      const saveObservable =
        this.isEditMode && this.journalId
          ? this.journalService.updateJournal(
              this.journalId,
              journalData as Journal
            )
          : this.journalService.createJournal(journalData as Journal);

      saveObservable.subscribe({
        next: () => {
          this.successMessage = `Journal ${status} successfully!`;
          this.isSaving = false;
          setTimeout(() => this.router.navigate(['/journal']), 1500);
        },
        error: (err) => {
          this.errorMessage = `Failed to save journal. ${
            err.error?.error || 'Please check the server logs.'
          }`;
          this.isSaving = false;
        },
      });
    };

    if (this.selectedFile) {
      this.journalService.uploadImage(this.selectedFile).subscribe({
        next: (response) => {
          journalData.imageUrl = response.imageUrl;
          finalizeSave();
        },
        error: (err) => {
          this.errorMessage = `Image upload failed. ${err.error?.error || ''}`;
          this.isSaving = false;
        },
      });
    } else {
      finalizeSave();
    }
  }

  onCancel(): void {
    this.router.navigate(['/journal']);
  }

  get f() {
    return this.journalForm.controls;
  }
}
