import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JournalService } from '../services/journal-service.service';
import { Journal } from '../models/journal.model';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-journal',
    templateUrl: './journal.component.html',
    styleUrls: ['./journal.component.scss'],
    imports: [CommonModule, RouterModule]
})
export class JournalComponent implements OnInit {
  journalEntries: Journal[] = [];
  isLoading: boolean = false;
  errorMessage: string | null = null;
  currentSortCriteria: string = 'date';
  sortDirection: { [key: string]: 'asc' | 'desc' } = {
    date: 'desc',
    tag: 'asc',
    category: 'asc'
  };

  readonly placeholderImage: string = 'assets/images/placeholder_journal.jpeg';
  private originalJournalEntries: Journal[] = [];

  private readonly backendUrl: string = environment.apiUrl;

  currentView: 'all' | 'published' | 'drafts' = 'all';

  constructor(private journalService: JournalService, private router: Router) { }

  ngOnInit(): void {
    this.getAllJournals();
  }

  getAllJournals(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.journalService.getAllJournals().subscribe({
      next: (data: any[]) => {
        this.originalJournalEntries = (data || [])
          .filter((entry: any) => entry != null)
          .map((entry: any) => {
            let dateObject: Date;
            if (entry.date) {
                const parsedDate = new Date(entry.date);
                if (!isNaN(parsedDate.getTime())) {
                    dateObject = parsedDate;
                } else {
                    dateObject = new Date();
                }
            } else {
                dateObject = new Date();
            }

            let fullImageUrl = this.placeholderImage;
            if (entry.imageUrl && typeof entry.imageUrl === 'string' && entry.imageUrl.trim() !== '') {
                if (entry.imageUrl.startsWith('http://') || entry.imageUrl.startsWith('https://') || entry.imageUrl.startsWith('data:image/')) {
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

        this.isLoading = false;
        this.applyFilterAndSort();
      },
      error: () => {
        this.errorMessage = 'Failed to load journal entries. Please try again later.';
        this.isLoading = false;
        this.originalJournalEntries = [];
        this.journalEntries = [];
      }
    });
  }

  private applyFilterAndSort(): void {
    let filteredJournals: Journal[] = [];

    if (this.currentView === 'all') {
      filteredJournals = [...this.originalJournalEntries];
    } else if (this.currentView === 'published') {
      filteredJournals = this.originalJournalEntries.filter(journal => journal.status === 'published');
    } else if (this.currentView === 'drafts') {
      filteredJournals = this.originalJournalEntries.filter(journal => journal.status === 'draft');
    }

    this.journalEntries = filteredJournals;
    this.sortJournals(this.currentSortCriteria);
  }

  setCurrentView(view: 'all' | 'published' | 'drafts'): void {
    if (this.currentView === view) {
      return;
    }
    this.currentView = view;
    this.applyFilterAndSort();
  }

  sortJournals(criteria: string): void {
    if (this.currentSortCriteria === criteria) {
      this.sortDirection[criteria] = this.sortDirection[criteria] === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortCriteria = criteria;
      this.sortDirection = { date: 'desc', tag: 'asc', category: 'asc' };
    }

    const directionMultiplier = this.sortDirection[criteria] === 'asc' ? 1 : -1;

    this.journalEntries.sort((a, b) => {
      if (criteria === 'date') {
        const dateA = (a.date instanceof Date ? a.date : new Date(a.date || ''))?.getTime() || 0;
        const dateB = (b.date instanceof Date ? b.date : new Date(b.date || ''))?.getTime() || 0;
        return (dateA - dateB) * directionMultiplier;
      } else if (criteria === 'tag') {
        const tagA = (a.tags && a.tags.length > 0) ? a.tags[0].toLowerCase() : '';
        const tagB = (b.tags && b.tags.length > 0) ? b.tags[0].toLowerCase() : '';
        return tagA.localeCompare(tagB) * directionMultiplier;
      } else if (criteria === 'category') {
        const categoryA = a.category ? a.category.toLowerCase() : '';
        const categoryB = b.category ? b.category.toLowerCase() : '';
        return categoryA.localeCompare(categoryB) * directionMultiplier;
      }
      return 0;
    });
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