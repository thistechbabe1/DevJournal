import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JournalService } from '../../services/journal-service.service';
import { Journal } from '../../models/journal.model';
import jsPDF from 'jspdf';
import { environment } from '../../../environments/environment';
import { AiAssistantService } from '../../services/ai-assistant.service';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
    selector: 'app-view-journal',
    templateUrl: './view-journal.component.html',
    styleUrls: ['./view-journal.component.scss'],
    imports: [CommonModule, FormsModule, RouterModule, SafeHtmlPipe]
})
export class ViewJournalComponent implements OnInit {
  journalId: string | null = null;
  journalEntry: Journal | undefined;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isSaving: boolean = false;
  successMessage: string | null = null;
  newRelatedLink: string = '';
  isGeneratingInsights: boolean = false;
  showInsightsSection: boolean = false;
  aiInsightsData: any = null;

  @ViewChild('journalContent') journalContent!: ElementRef;
  @ViewChild('pdfExportContent') pdfExportContent!: ElementRef;
  private readonly backendUrl: string = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private journalService: JournalService,
    private router: Router,
    private aiService: AiAssistantService
  ) {}

  ngOnInit(): void {
    this.journalId = this.route.snapshot.paramMap.get('id');
    if (this.journalId) {
      this.getJournalDetails(this.journalId);
    } else {
      this.errorMessage = 'Journal ID not provided.';
      this.isLoading = false;
    }
  }

  getJournalDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.journalService.getJournalById(id).subscribe({
      next: (data: Journal) => {
        let processedJournal: Journal = { ...data };
        if (
          processedJournal.imageUrl &&
          typeof processedJournal.imageUrl === 'string' &&
          processedJournal.imageUrl.trim() !== ''
        ) {
          if (
            !processedJournal.imageUrl.startsWith('http://') &&
            !processedJournal.imageUrl.startsWith('https://') &&
            !processedJournal.imageUrl.startsWith('data:image/')
          ) {
            processedJournal.imageUrl = `${this.backendUrl}${processedJournal.imageUrl}`;
          }
        }
        this.journalEntry = processedJournal;

        if (!this.journalEntry.relatedLinks) {
          this.journalEntry.relatedLinks = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load journal:', err);
        this.errorMessage =
          'Failed to load journal details. It might not exist or there was a server error.';
        this.isLoading = false;
      },
    });
  }

  getInsightsFromAI(): void {
    if (!this.journalEntry?.content || this.isGeneratingInsights) {
      return;
    }

    this.isGeneratingInsights = true;
    this.showInsightsSection = true;
    this.aiInsightsData = null;

    this.aiService.getJournalInsights(this.journalEntry.content).subscribe({
      next: (response) => {
        this.aiInsightsData = response.insights;
        this.isGeneratingInsights = false;
      },
      error: (err) => {
        console.error('Error getting AI insights for journal:', err);
        this.aiInsightsData = {
          error: 'Failed to generate insights from the AI. Please try again.',
        };
        this.isGeneratingInsights = false;
      },
    });
  }

  goBackToJournals(): void {
    this.router.navigate(['/journal']);
  }

  getTagsAsString(tags: string[] | undefined): string {
    return tags && tags.length > 0
      ? tags.map((tag) => '#' + tag).join(', ')
      : '';
  }

  saveChanges(): void {
    if (!this.journalEntry || !this.journalEntry._id) {
      this.errorMessage =
        'Cannot save changes: Journal entry or ID is missing.';
      setTimeout(() => (this.errorMessage = null), 5000);
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const journalToSave = { ...this.journalEntry };
    if (
      journalToSave.imageUrl &&
      journalToSave.imageUrl.startsWith(this.backendUrl)
    ) {
      journalToSave.imageUrl = journalToSave.imageUrl.replace(
        this.backendUrl,
        ''
      );
    }

    this.journalService
      .updateJournal(journalToSave._id!, journalToSave)
      .subscribe({
        next: (updatedJournal) => {
          let processedUpdatedJournal: Journal = { ...updatedJournal };
          if (
            processedUpdatedJournal.imageUrl &&
            typeof processedUpdatedJournal.imageUrl === 'string' &&
            processedUpdatedJournal.imageUrl.trim() !== ''
          ) {
            if (
              !processedUpdatedJournal.imageUrl.startsWith('http://') &&
              !processedUpdatedJournal.imageUrl.startsWith('https://') &&
              !processedUpdatedJournal.imageUrl.startsWith('data:image/')
            ) {
              processedUpdatedJournal.imageUrl = `${this.backendUrl}${processedUpdatedJournal.imageUrl}`;
            }
          }
          this.journalEntry = processedUpdatedJournal;
          this.successMessage = 'Changes saved successfully!';
          this.isSaving = false;
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: (err) => {
          console.error('Failed to save changes:', err);
          this.errorMessage = 'Failed to save changes. Please try again.';
          this.isSaving = false;
          setTimeout(() => (this.errorMessage = null), 5000);
        },
      });
  }

  saveNotes(): void {
    if (this.journalEntry) {
      this.saveChanges();
    }
  }

  addRelatedLink(): void {
    if (this.journalEntry && this.newRelatedLink.trim()) {
      if (!this.journalEntry.relatedLinks) {
        this.journalEntry.relatedLinks = [];
      }
      this.journalEntry.relatedLinks.push(this.newRelatedLink.trim());
      this.newRelatedLink = '';
      this.saveChanges();
    }
  }

  deleteRelatedLink(index: number): void {
    if (
      this.journalEntry &&
      this.journalEntry.relatedLinks &&
      confirm('Are you sure you want to remove this link?')
    ) {
      this.journalEntry.relatedLinks.splice(index, 1);
      this.saveChanges();
    }
  }

  editJournal(): void {
    if (this.journalEntry && this.journalEntry._id) {
      this.router.navigate(['/edit-journal', this.journalEntry._id]);
    } else {
      this.errorMessage = 'Cannot edit: Journal ID is missing.';
      setTimeout(() => (this.errorMessage = null), 3000);
    }
  }

  deleteJournal(): void {
    if (!this.journalEntry || !this.journalEntry._id) {
      this.errorMessage = 'Journal not found for deletion.';
      setTimeout(() => (this.errorMessage = null), 3000);
      return;
    }

    if (
      confirm(
        'Are you sure you want to delete this journal entry? This action cannot be undone.'
      )
    ) {
      this.isLoading = true;
      this.errorMessage = null;
      this.successMessage = null;

      this.journalService.deleteJournal(this.journalEntry._id).subscribe({
        next: () => {
          this.successMessage = 'Journal entry deleted successfully!';
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/journal']);
          }, 1500);
        },
        error: (err) => {
          console.error('Failed to delete journal entry:', err);
          this.errorMessage =
            'Failed to delete journal entry. Please try again.';
          this.isLoading = false;
          setTimeout(() => (this.errorMessage = null), 5000);
        },
      });
    }
  }

  exportJournalAsPdf(): void {
    if (!this.journalEntry) {
      this.errorMessage = 'No journal data to export.';
      return;
    }

    this.isSaving = true;
    const element = this.pdfExportContent.nativeElement;
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `${this.journalEntry.title || 'Journal_Entry'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      this.isSaving = false;
      this.successMessage = 'Journal exported as PDF!';
      setTimeout(() => (this.successMessage = null), 3000);
    }).catch((err: any) => {
      this.isSaving = false;
      this.errorMessage = 'Failed to export PDF. Please try again.';
      console.error('PDF Export Error:', err);
    });
  }

  // exportJournalAsPdf(): void {
  //   if (!this.journalEntry) {
  //     this.errorMessage = 'No journal data to export.';
  //     return;
  //   }

  //   this.isSaving = true;
  //   const element = this.journalContent.nativeElement;
  //   const opt = {
  //     margin: 1,
  //     filename: `${this.journalEntry.title || 'Journal_Entry'}.pdf`,
  //     image: { type: 'jpeg', quality: 0.98 },
  //     html2canvas: { scale: 2, useCORS: true },
  //     jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  //   };

  //   // New Promise-based syntax for html2pdf
  //   html2pdf()
  //     .from(element)
  //     .set(opt)
  //     .save()
  //     .then(() => {
  //       this.isSaving = false;
  //       this.successMessage = 'Journal exported as PDF!';
  //       setTimeout(() => (this.successMessage = null), 3000);
  //     })
  //     .catch((err: any) => {
  //       this.isSaving = false;
  //       this.errorMessage = 'Failed to export PDF. Please try again.';
  //       console.error('PDF Export Error:', err);
  //     });
  // }

  // private continuePdfGeneration(doc: jsPDF, currentY: number): void {
  //   let yPos = currentY;
  //   const margin = 15;
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   const pageHeight = doc.internal.pageSize.getHeight();

  //   const addNewPage = (
  //     docInstance: jsPDF,
  //     currentY: number,
  //     lineSpacing: number = 0
  //   ) => {
  //     if (currentY + lineSpacing >= pageHeight - margin) {
  //       docInstance.addPage();
  //       return margin;
  //     }
  //     return currentY + lineSpacing;
  //   };

  //   if (this.journalEntry?.content) {
  //     doc.setFontSize(12);
  //     doc.setFont('helvetica', 'normal');
  //     yPos = addNewPage(doc, yPos, 10);
  //     const parser = new DOMParser();
  //     const docHtml = parser.parseFromString(
  //       this.journalEntry.content,
  //       'text/html'
  //     );
  //     const textContent = docHtml.body.textContent || '';
  //     const contentLines = doc.splitTextToSize(
  //       textContent,
  //       pageWidth - 2 * margin
  //     );
  //     contentLines.forEach((line: string | string[]) => {
  //       yPos = addNewPage(doc, yPos, 7);
  //       doc.text(line, margin, yPos);
  //     });
  //   }

  //   if (this.journalEntry?.notes) {
  //     yPos = addNewPage(doc, yPos, 15);
  //     doc.setFontSize(16);
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Notes', margin, yPos);
  //     yPos = addNewPage(doc, yPos, 10);
  //     doc.setFontSize(12);
  //     doc.setFont('helvetica', 'normal');
  //     const notesLines = doc.splitTextToSize(
  //       this.journalEntry.notes,
  //       pageWidth - 2 * margin
  //     );
  //     notesLines.forEach((line: string | string[]) => {
  //       yPos = addNewPage(doc, yPos, 7);
  //       doc.text(line, margin, yPos);
  //     });
  //   }

  //   if (
  //     this.journalEntry?.relatedLinks &&
  //     this.journalEntry.relatedLinks.length > 0
  //   ) {
  //     yPos = addNewPage(doc, yPos, 15);
  //     doc.setFontSize(16);
  //     doc.setFont('helvetica', 'bold');
  //     doc.text('Related Work', margin, yPos);
  //     yPos = addNewPage(doc, yPos, 10);
  //     doc.setFontSize(10);
  //     doc.setFont('helvetica', 'normal');
  //     this.journalEntry.relatedLinks.forEach((link) => {
  //       yPos = addNewPage(doc, yPos, 6);
  //       doc.text(`🔗 ${link}`, margin, yPos);
  //     });
  //   }

  //   doc.save(`${this.journalEntry?.title || 'Journal_Entry'}.pdf`);
  //   this.successMessage = 'Journal exported as PDF!';
  //   this.isLoading = false;
  //   setTimeout(() => (this.successMessage = null), 3000);
  // }

  // private loadImageToBase64(url: string): Promise<string | null> {
  //   return new Promise((resolve, reject) => {
  //     const img = new Image();
  //     img.crossOrigin = 'Anonymous';
  //     img.onload = () => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = img.width;
  //       canvas.height = img.height;
  //       const ctx = canvas.getContext('2d');
  //       if (ctx) {
  //         ctx.drawImage(img, 0, 0);
  //         resolve(canvas.toDataURL('image/png'));
  //       } else {
  //         reject('Could not get canvas context');
  //       }
  //     };
  //     img.onerror = (error) => {
  //       reject(error);
  //     };
  //     img.src = url;
  //   });
  // }
}
