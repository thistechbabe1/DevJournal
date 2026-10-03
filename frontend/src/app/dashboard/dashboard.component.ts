import { Component, OnInit } from '@angular/core';
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
  userName: string = 'User';
  activities: any[] = [];
  totalJournals: number = 0;
  draftCount: number = 0;
  lastActivityDate: Date | string | undefined;

  aiTip: string = 'Loading a fresh dev insight...';

  private fallbackTips: string[] = [
    "Always plan your code before you write it. A little planning saves a lot of debugging.",
    "Break down complex problems into smaller, manageable chunks.",
    "Write clean, readable code. Clarity over cleverness, always.",
    "Use meaningful variable and function names. Self-documenting code is best.",
    "Practice consistent indentation and formatting. Your code's aesthetics matter.",
    "Comment your code to explain 'why', not 'what'.",
    "Embrace version control (Git) early and commit often with descriptive messages.",
    "Test your code thoroughly. Unit tests are your safety net.",
    "Learn to debug effectively. It's a critical skill for every developer.",
    "Don't repeat yourself (DRY principle). Extract reusable functions and components.",
    "Continuously refactor your code to improve its structure and maintainability.",
    "Stay curious and never stop learning. Technology evolves rapidly.",
    "Read other people's code. It's a great way to learn new patterns and solutions.",
    "Understand the 'why' behind the code, not just the 'how'.",
    "Take regular breaks to avoid burnout and maintain focus.",
    "Seek feedback on your code through code reviews. Fresh eyes catch more.",
    "Learn foundational computer science concepts (data structures, algorithms).",
    "Specialize in an area you enjoy, but maintain a broad understanding of the ecosystem.",
    "Build side projects to apply your knowledge and explore new technologies.",
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
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.name) {
      this.userName = currentUser.name;
    } else if (currentUser && currentUser.email) {
      this.userName = currentUser.email.split('@')[0];
    }

    if (currentUser && currentUser.createdAt) {
      this.lastActivityDate = new Date(currentUser.createdAt);
    } else {
      this.lastActivityDate = 'N/A';
    }

    this.loadJournalData();
    this.fetchDevTipFromApi();
  }

  loadJournalData(): void {
    this.journalService.getAllJournals().subscribe({
      next: (journals) => {
        const validJournals = journals.filter((j: any) => j != null);
        const sorted = validJournals.sort(
          (a: any, b: any) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        );

        this.totalJournals = sorted.filter((j: any) => j.status === 'published').length;
        this.draftCount = sorted.filter((j: any) => j.status === 'draft').length;

        if (sorted.length > 0) {
          const latestActivityDateSource = sorted[0]?.updatedAt || sorted[0]?.createdAt;
          if (latestActivityDateSource) {
            this.lastActivityDate = new Date(latestActivityDateSource);
          }
        }

        this.activities = sorted.slice(0, 3);
      },
      error: (err: HttpErrorResponse) => {
        this.totalJournals = 0;
        this.draftCount = 0;
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.createdAt) {
           this.lastActivityDate = new Date(currentUser.createdAt);
        } else {
           this.lastActivityDate = 'N/A';
        }
        this.activities = [];
        this.snackBar.open('Failed to load journal data.', 'Dismiss', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  fetchDevTipFromApi(): void {
    this.aiTip = this.getRandomFallbackTip();
  }

  private getRandomFallbackTip(): string {
    return this.fallbackTips[Math.floor(Math.random() * this.fallbackTips.length)];
  }

  getNewAiTip(): void {
    this.aiTip = this.getRandomFallbackTip();
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
      next: (res) => {
        this.quickEntryContent = '';
        this.loadJournalData();
        this.snackBar.open('Quick entry saved successfully!', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err: HttpErrorResponse) => {
        this.snackBar.open('Failed to save quick entry. Please try again.', 'Dismiss', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  get formattedLastActivityDate(): string {
    if (this.lastActivityDate instanceof Date) {
      return this.datePipe.transform(this.lastActivityDate, 'mediumDate') || 'N/A';
    } else if (typeof this.lastActivityDate === 'string' && this.lastActivityDate === 'N/A') {
      return 'N/A';
    } else {
      return 'N/A';
    }
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