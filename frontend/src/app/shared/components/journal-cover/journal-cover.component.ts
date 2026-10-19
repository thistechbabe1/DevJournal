import {
  Component,
  Input,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export const COVER_TINTS = ['terracotta', 'ochre', 'sage', 'slate', 'clay'] as const;
export type CoverTint = typeof COVER_TINTS[number];

export function getStableTint(id: string | null | undefined): CoverTint {
  if (!id) return 'terracotta';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COVER_TINTS.length;
  return COVER_TINTS[index];
}

let nextUniqueId = 0;

@Component({
  selector: 'app-journal-cover',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './journal-cover.component.html',
  styleUrls: ['./journal-cover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalCoverComponent {
  @Input() journalId?: string | null = '';
  @Input() title?: string | null = '';
  @Input() category?: string | null = '';
  @Input() imageUrl?: string | null = null;
  @Input() variant: 'card' | 'banner' = 'card';

  readonly uniqueId = `jc-dot-${++nextUniqueId}`;
  readonly imageFailed = signal<boolean>(false);

  readonly hasValidImage = computed(() => {
    return !this.imageFailed() && typeof this.imageUrl === 'string' && this.imageUrl.trim().length > 0;
  });

  readonly tint = computed<CoverTint>(() => {
    return getStableTint(this.journalId);
  });

  readonly initial = computed<string>(() => {
    const raw = (this.title || '').trim();
    if (!raw) return 'J';
    // Match first alphanumeric character
    const match = raw.match(/[a-zA-Z0-9]/);
    return (match ? match[0] : raw.charAt(0)).toUpperCase();
  });

  readonly displayCategory = computed<string>(() => {
    return (this.category || 'JOURNAL').trim().toUpperCase();
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}
