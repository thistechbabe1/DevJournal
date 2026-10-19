import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JournalService } from '../../services/journal-service.service';
import { Journal } from '../../models/journal.model';
import { environment } from '../../../../../environments/environment';
import { JournalCoverComponent } from '../../../../shared/components/journal-cover/journal-cover.component';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.component.html',
  styleUrls: ['./journal.component.scss'],
  imports: [CommonModule, RouterModule, JournalCoverComponent]
})
export class JournalComponent implements OnInit {
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly currentView = signal<'all' | 'published' | 'drafts'>('all');
  readonly currentSortCriteria = signal<string>('date');
  readonly sortDirection = signal<{ [key: string]: 'asc' | 'desc' }>({
    date: 'desc',
    tag: 'asc',
    category: 'asc'
  });

  private readonly backendUrl: string = environment.apiUrl;

  private readonly rawJournals = this.journalService.journals;

  private readonly normalizedEntries = computed<Journal[]>(() => {
    const data = this.rawJournals();
    return (data || [])
      .filter((entry: any) => entry != null)
      .map((entry: any) => {
        let dateObject: Date;
        if (entry.date) {
          const parsedDate = new Date(entry.date);
          dateObject = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
        } else {
          dateObject = new Date();
        }

        let fullImageUrl: string | null = null;
        if (entry.imageUrl && typeof entry.imageUrl === 'string' && entry.imageUrl.trim() !== '') {
          if (
            entry.imageUrl.startsWith('http://') ||
            entry.imageUrl.startsWith('https://') ||
            entry.imageUrl.startsWith('data:image/')
          ) {
            fullImageUrl = entry.imageUrl;
          } else {
            fullImageUrl = `${this.backendUrl}${entry.imageUrl}`;
          }
        }

        return {
          ...entry,
          imageUrl: fullImageUrl,
          date: dateObject,
          status: entry.status || 'published'
        } as Journal;
      });
  });

  readonly totalEntriesCount = computed(() => this.normalizedEntries().length);
  readonly publishedEntriesCount = computed(
    () => this.normalizedEntries().filter(j => j.status === 'published').length
  );
  readonly draftEntriesCount = computed(
    () => this.normalizedEntries().filter(j => j.status === 'draft').length
  );

  readonly journalEntries = computed<Journal[]>(() => {
    const entries = this.normalizedEntries();
    const view = this.currentView();
    const criteria = this.currentSortCriteria();
    const directions = this.sortDirection();

    let filtered: Journal[];
    if (view === 'published') {
      filtered = entries.filter(journal => journal.status === 'published');
    } else if (view === 'drafts') {
      filtered = entries.filter(journal => journal.status === 'draft');
    } else {
      filtered = [...entries];
    }

    const directionMultiplier = directions[criteria] === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      if (criteria === 'date') {
        const dateA = (a.date instanceof Date ? a.date : new Date(a.date || ''))?.getTime() || 0;
        const dateB = (b.date instanceof Date ? b.date : new Date(b.date || ''))?.getTime() || 0;
        return (dateA - dateB) * directionMultiplier;
      } else if (criteria === 'tag') {
        const tagA = a.tags && a.tags.length > 0 ? a.tags[0].toLowerCase() : '';
        const tagB = b.tags && b.tags.length > 0 ? b.tags[0].toLowerCase() : '';
        return tagA.localeCompare(tagB) * directionMultiplier;
      } else if (criteria === 'category') {
        const categoryA = a.category ? a.category.toLowerCase() : '';
        const categoryB = b.category ? b.category.toLowerCase() : '';
        return categoryA.localeCompare(categoryB) * directionMultiplier;
      }
      return 0;
    });
  });

  constructor(private journalService: JournalService, private router: Router) {}

  ngOnInit(): void {
    this.getAllJournals();
  }

  getAllJournals(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.journalService.getAllJournals().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Failed to load journal entries. Please try again later.');
        this.isLoading.set(false);
      }
    });
  }

  setCurrentView(view: 'all' | 'published' | 'drafts'): void {
    if (this.currentView() === view) {
      return;
    }
    this.currentView.set(view);
  }

  sortJournals(criteria: string): void {
    if (this.currentSortCriteria() === criteria) {
      this.sortDirection.update(dirs => ({
        ...dirs,
        [criteria]: dirs[criteria] === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      this.currentSortCriteria.set(criteria);
      this.sortDirection.set({ date: 'desc', tag: 'asc', category: 'asc' });
    }
  }

  viewJournal(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/view-journal', id]);
    }
  }

  addNewJournal(): void {
    this.router.navigate(['/add-journal']);
  }

  editJournal(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/edit-journal', id]);
    }
  }
}