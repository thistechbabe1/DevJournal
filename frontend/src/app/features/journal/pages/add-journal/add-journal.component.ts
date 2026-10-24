import { Component, OnInit, OnDestroy, ChangeDetectorRef, effect } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { JournalService } from '../../services/journal-service.service';
import { Journal } from '../../models/journal.model';
import { ThemeService } from '../../../../core/services/theme.service';
import { environment } from '../../../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-add-journal',
    templateUrl: './add-journal.component.html',
    styleUrls: ['./add-journal.component.scss'],
    imports: [ReactiveFormsModule, EditorModule, RouterModule],
    providers: [
      { provide: TINYMCE_SCRIPT_SRC, useValue: '/tinymce/tinymce.min.js' }
    ]
})
export class AddJournalComponent implements OnInit, OnDestroy {
  journalForm!: FormGroup;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  isSaving: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  isEditMode: boolean = false;
  journalId: string | null = null;
  sanitizedBackendContent: SafeHtml | null = null;
  isEditorActive: boolean = true;
  editorConfig: Record<string, any> = {};
  private currentEditor: any = null;
  private editorInitHandler: (() => void) | null = null;
  private editorChangeHandler: (() => void) | null = null;
  private savedBookmark: any = null;
  private savedContentForReinit: string | null = null;
  private isInitialized: boolean = false;

  private readonly backendUrl: string = environment.apiUrl;

  constructor(
    private fb: FormBuilder,
    private journalService: JournalService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    public themeService: ThemeService
  ) {
    this.editorConfig = this.buildEditorConfig();

    effect(() => {
      // Listen to theme changes from ThemeService signal
      const currentTheme = this.themeService.theme();
      if (this.isInitialized) {
        this.reinitEditorForTheme();
      }
    });
  }

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

    this.isInitialized = true;
  }

  autoResizeTitle(event?: Event): void {
    const textarea = event ? (event.target as HTMLTextAreaElement) : (document.getElementById('title') as HTMLTextAreaElement);
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(48, textarea.scrollHeight)}px`;
    }
  }

  private buildEditorConfig(): Record<string, any> {
    const isDark = this.themeService.theme() === 'dark';
    const computed = typeof window !== 'undefined' && typeof document !== 'undefined'
      ? window.getComputedStyle(document.documentElement)
      : null;

    const surface = computed?.getPropertyValue('--color-surface')?.trim() || '';
    const ink = computed?.getPropertyValue('--color-ink')?.trim() || '';
    const muted = computed?.getPropertyValue('--color-muted')?.trim() || '';
    const line = computed?.getPropertyValue('--color-line')?.trim() || '';
    const accent = computed?.getPropertyValue('--color-accent')?.trim() || '';
    const fontUi = computed?.getPropertyValue('--font-ui')?.trim() || 'sans-serif';
    const fontMono = computed?.getPropertyValue('--font-mono')?.trim() || 'monospace';

    const contentStyle = `
      body {
        background-color: ${surface};
        color: ${ink};
        font-family: ${fontUi};
        font-size: 1rem;
        line-height: 1.6;
        padding: 1rem;
        margin: 0;
      }
      body::before {
        color: ${muted};
        opacity: 0.8;
      }
      a {
        color: ${accent};
        text-decoration: underline;
      }
      code {
        font-family: ${fontMono};
        background-color: ${line};
        padding: 0.15em 0.35em;
        border-radius: 4px;
        font-size: 0.9em;
      }
      pre {
        background-color: ${surface};
        border: 1px solid ${line};
        padding: 0.75rem 1rem;
        border-radius: 6px;
        font-family: ${fontMono};
        font-size: 0.9em;
        line-height: 1.5;
        overflow-x: auto;
        max-width: 100%;
        box-sizing: border-box;
      }
      pre code {
        background-color: transparent;
        padding: 0;
        border-radius: 0;
        font-size: inherit;
      }
      blockquote {
        border-left: 3px solid ${accent};
        margin: 1rem 0;
        padding-left: 1rem;
        color: ${muted};
        font-style: italic;
      }
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: ${surface};
      }
      ::-webkit-scrollbar-thumb {
        background: ${line};
        border-radius: 4px;
      }
      * {
        scrollbar-color: ${line} ${surface};
        scrollbar-width: thin;
      }
    `;

    const isMobile = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 768px)').matches
      : false;

    return {
      license_key: 'gpl',
      base_url: '/tinymce',
      suffix: '.min',
      promotion: false,
      branding: false,
      resize: false,
      min_height: 380,
      height: isMobile ? 380 : 420,
      menubar: !isMobile,
      skin: isDark ? 'oxide-dark' : 'oxide',
      content_css: isDark ? 'dark' : 'default',
      content_style: contentStyle,
      placeholder: 'Write your journal entry here...',
      plugins: [
        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
        'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table',
        'wordcount', 'codesample', 'help', 'pagebreak', 'nonbreaking'
      ],
      toolbar: isMobile
        ? 'bold italic bullist link | undo redo numlist codesample code'
        : 'undo redo | styleselect | bold italic underline strikethrough | ' +
          'alignleft aligncenter alignright alignjustify | outdent indent | ' +
          'bullist numlist | link image media codesample | hr pagebreak | ' +
          'fullscreen preview | charmap | insertdatetime | table | help | code',
      toolbar_mode: isMobile ? 'sliding' : 'wrap',
      setup: (editor: any) => {
        this.cleanupEditorListeners();
        this.currentEditor = editor;
        this.editorInitHandler = () => {
          if (typeof document !== 'undefined') {
            document.querySelectorAll('editor').forEach(el => el.removeAttribute('aria-hidden'));
          }
          if (this.savedContentForReinit !== null) {
            try {
              editor.setContent(this.savedContentForReinit);
              this.journalForm.get('content')?.setValue(this.savedContentForReinit, { emitEvent: true });
              this.journalForm.get('content')?.markAsDirty();
              this.journalForm.get('content')?.updateValueAndValidity();
            } catch (e) {}
            this.savedContentForReinit = null;
          }
          if (this.savedBookmark) {
            try {
              editor.selection?.moveToBookmark(this.savedBookmark);
            } catch (e) {
              // Graceful fallback
            }
            this.savedBookmark = null;
          }
        };
        this.editorChangeHandler = () => {
          const content = editor.getContent();
          if (this.journalForm.get('content')?.value !== content) {
            this.journalForm.get('content')?.setValue(content, { emitEvent: true });
            this.journalForm.get('content')?.markAsDirty();
            this.journalForm.get('content')?.updateValueAndValidity();
          }
        };
        editor.on('init', this.editorInitHandler);
        editor.on('change input undo redo SetContent keyup', this.editorChangeHandler);
      }
    };
  }

  private cleanupEditorListeners(): void {
    if (this.currentEditor) {
      if (this.editorInitHandler) {
        try {
          this.currentEditor.off('init', this.editorInitHandler);
        } catch (e) {}
        this.editorInitHandler = null;
      }
      if (this.editorChangeHandler) {
        try {
          this.currentEditor.off('change input undo redo SetContent keyup', this.editorChangeHandler);
        } catch (e) {}
        this.editorChangeHandler = null;
      }
      this.currentEditor = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanupEditorListeners();
  }

  get publishDisabledReason(): string {
    if (this.isSaving) return 'Saving in progress...';
    const t = this.journalForm.get('title');
    if (t?.invalid) {
      if (t.errors?.['required']) return 'Title is required to publish.';
      if (t.errors?.['minlength']) return 'Title must be at least 3 characters.';
    }
    const c = this.journalForm.get('content');
    if (c?.invalid) {
      if (c.errors?.['required']) return 'Content is required to publish.';
      if (c.errors?.['minlength']) return 'Content must be at least 10 characters.';
    }
    const cat = this.journalForm.get('category');
    if (cat?.invalid) return 'Category is required to publish.';
    const d = this.journalForm.get('date');
    if (d?.invalid) return 'A valid date is required to publish.';
    if (this.journalForm.invalid) return 'Please complete all required fields to publish.';
    return '';
  }

  private reinitEditorForTheme(): void {
    let currentContent = this.journalForm.get('content')?.value;
    if (this.currentEditor) {
      try {
        const liveContent = this.currentEditor.getContent();
        if (liveContent) {
          currentContent = liveContent;
          this.journalForm.get('content')?.setValue(liveContent, { emitEvent: true });
        }
      } catch (e) {}
      try {
        this.savedBookmark = this.currentEditor.selection?.getBookmark(2, true);
      } catch (e) {
        this.savedBookmark = null;
      }
      this.cleanupEditorListeners();
    }
    this.savedContentForReinit = currentContent ?? null;
    this.isEditorActive = false;
    this.editorConfig = this.buildEditorConfig();
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isEditorActive = true;
      if (this.savedContentForReinit !== null) {
        this.journalForm.get('content')?.setValue(this.savedContentForReinit, { emitEvent: true });
      }
      this.cdr.detectChanges();
    }, 10);
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
        setTimeout(() => this.autoResizeTitle(), 50);
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
