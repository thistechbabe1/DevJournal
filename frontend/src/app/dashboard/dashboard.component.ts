import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { JournalService } from '../services/journal-service.service';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule, MatSnackBarModule],
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit {
  private readonly journals = this.journalService.journals;

  readonly userName = computed(() => {
    const profile = this.authService.currentUserProfile();
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email.split('@')[0];
    const user = this.authService.getCurrentUser();
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  });

  readonly totalJournals = this.journalService.publishedCount;
  readonly draftCount = this.journalService.draftCount;

  readonly activities = computed(() => {
    const valid = this.journals().filter((j: any) => j != null);
    const sorted = [...valid].sort(
      (a: any, b: any) =>
        new Date(b.updatedAt || b.createdAt || b.date).getTime() -
        new Date(a.updatedAt || a.createdAt || a.date).getTime()
    );
    return sorted.slice(0, 3).map((j: any) => ({
      _id: j._id,
      title: j.title,
      entry: j.content ? j.content.replace(/<[^>]*>/g, '').slice(0, 100) : '',
      createdAt: j.createdAt || j.date
    }));
  });

  readonly lastActivityDate = computed(() => {
    const valid = this.journals().filter((j: any) => j != null);
    if (valid.length > 0) {
      const sorted = [...valid].sort(
        (a: any, b: any) =>
          new Date(b.updatedAt || b.createdAt || b.date).getTime() -
          new Date(a.updatedAt || a.createdAt || a.date).getTime()
      );
      return sorted[0].updatedAt || sorted[0].createdAt || sorted[0].date;
    }
    const user = this.authService.getCurrentUser();
    return user?.createdAt || null;
  });

  readonly formattedLastActivityDate = computed(() => {
    const dateVal = this.lastActivityDate();
    if (dateVal) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return this.datePipe.transform(d, 'mediumDate') || 'N/A';
      }
    }
    return 'N/A';
  });

  readonly aiTip = signal<string>('Loading a fresh dev insight...');

  private fallbackTips: string[] = [
    'Always plan your code before you write it. A little planning saves a lot of debugging.',
    'Break down complex problems into smaller, manageable chunks.',
    'Write clean, readable code. Clarity over cleverness, always.',
    'Use meaningful variable and function names. Self-documenting code is best.',
    "Practice consistent indentation and formatting. Your code's aesthetics matter.",
    "Comment your code to explain 'why', not 'what'.",
    'Embrace version control (Git) early and commit often with descriptive messages.',
    'Test your code thoroughly. Unit tests are your safety net.',
    "Learn to debug effectively. It's a critical skill for every developer.",
    "Don't repeat yourself (DRY principle). Extract reusable functions and components.",
    'Continuously refactor your code to improve its structure and maintainability.',
    'Stay curious and never stop learning. Technology evolves rapidly.',
    "Read other people's code. It's a great way to learn new patterns and solutions.",
    "Understand the 'why' behind the code, not just the 'how'.",
    'Take regular breaks to avoid burnout and maintain focus.',
    'Seek feedback on your code through code reviews. Fresh eyes catch more.',
    'Learn foundational computer science concepts (data structures, algorithms).',
    'Specialize in an area you enjoy, but maintain a broad understanding of the ecosystem.',
    'Build side projects to apply your knowledge and explore new technologies.',
    "Don't be afraid to make mistakes; they are crucial learning opportunities."
  ];

  quickEntryContent: string = '';

  constructor(
    private journalService: JournalService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadJournalData();
    this.fetchDevTipFromApi();
  }

  loadJournalData(): void {
    this.journalService.getAllJournals().subscribe({
      error: () => {
        this.snackBar.open('Failed to load journal data.', 'Dismiss', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  fetchDevTipFromApi(): void {
    this.aiTip.set(this.getRandomFallbackTip());
  }

  private getRandomFallbackTip(): string {
    return this.fallbackTips[Math.floor(Math.random() * this.fallbackTips.length)];
  }

  getNewAiTip(): void {
    this.aiTip.set(this.getRandomFallbackTip());
  }

  submitQuickEntry(): void {
    if (!this.quickEntryContent.trim()) {
      this.snackBar.open('Quick entry cannot be empty!', 'Dismiss', {
        duration: 3000,
        panelClass: ['snackbar-warning']
      });
      return;
    }

    const newEntry = {
      title: 'Quick Entry - ' + new Date().toLocaleDateString(),
      content: this.quickEntryContent,
      date: new Date().toISOString(),
      tags: ['quick-note'],
      status: 'published'
    };

    this.journalService.createJournal(newEntry).subscribe({
      next: () => {
        this.quickEntryContent = '';
        this.snackBar.open('Quick entry saved successfully!', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: () => {
        this.snackBar.open('Failed to save quick entry. Please try again.', 'Dismiss', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  getFormattedActivityDate(dateString: string | Date | undefined): string {
    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return this.datePipe.transform(date, 'mediumDate') || 'N/A';
      }
    }
    return 'N/A';
  }
}