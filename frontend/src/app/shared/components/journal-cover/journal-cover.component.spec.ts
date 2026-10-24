import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JournalCoverComponent, getStableTint, COVER_TINTS } from './journal-cover.component';
import { By } from '@angular/platform-browser';

describe('JournalCoverComponent', () => {
  let component: JournalCoverComponent;
  let fixture: ComponentFixture<JournalCoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalCoverComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(JournalCoverComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('stable colour per id', () => {
    it('should return a deterministic tint for the same journal id', () => {
      const id1 = '661234567890abcdef123456';
      const tint1 = getStableTint(id1);
      const tint2 = getStableTint(id1);
      expect(tint1).toBe(tint2);
      expect(COVER_TINTS).toContain(tint1);
    });

    it('should assign a valid tint from COVER_TINTS even when id is empty or null', () => {
      expect(getStableTint(null)).toBe('terracotta');
      expect(getStableTint(undefined)).toBe('terracotta');
      expect(getStableTint('')).toBe('terracotta');
    });

    it('should reflect stable data-tint attribute on the root container', () => {
      component.journalId = 'entry-abc-123';
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.journal-cover-container'));
      expect(container.attributes['data-tint']).toBe(getStableTint('entry-abc-123'));
    });
  });

  describe('no image request when none is set', () => {
    it('should render SVG and NOT render an img element when imageUrl is null or empty', () => {
      component.imageUrl = null;
      component.title = 'Refactoring Architecture';
      component.category = 'Backend';
      fixture.detectChanges();

      const imgEl = fixture.debugElement.query(By.css('img'));
      expect(imgEl).toBeNull();

      const svgEl = fixture.debugElement.query(By.css('svg.cover-svg'));
      expect(svgEl).not.toBeNull();

      const initialText = fixture.debugElement.query(By.css('.cover-initial'));
      expect(initialText.nativeElement.textContent.trim()).toBe('R');

      const categoryText = fixture.debugElement.query(By.css('.cover-category'));
      expect(categoryText.nativeElement.textContent.trim()).toBe('BACKEND');
    });

    it('should not render an img element when imageUrl is whitespace only', () => {
      component.imageUrl = '   ';
      fixture.detectChanges();

      const imgEl = fixture.debugElement.query(By.css('img'));
      expect(imgEl).toBeNull();
    });
  });

  describe('image error fallback', () => {
    it('should show img element initially when imageUrl is valid', () => {
      component.imageUrl = 'https://example.com/cover.jpg';
      fixture.detectChanges();

      const imgEl = fixture.debugElement.query(By.css('img'));
      expect(imgEl).not.toBeNull();
      expect(imgEl.nativeElement.getAttribute('src')).toBe('https://example.com/cover.jpg');

      const svgEl = fixture.debugElement.query(By.css('svg.cover-svg'));
      expect(svgEl).toBeNull();
    });

    it('should fall back to generated SVG cover when img emits an error', () => {
      component.imageUrl = 'https://example.com/broken-image.jpg';
      component.title = 'Database Tuning';
      fixture.detectChanges();

      const imgEl = fixture.debugElement.query(By.css('img'));
      expect(imgEl).not.toBeNull();

      // Trigger error event on the image
      imgEl.triggerEventHandler('error', new Event('error'));
      fixture.detectChanges();

      // img is removed, SVG fallback is shown
      const imgAfterError = fixture.debugElement.query(By.css('img'));
      expect(imgAfterError).toBeNull();

      const svgAfterError = fixture.debugElement.query(By.css('svg.cover-svg'));
      expect(svgAfterError).not.toBeNull();

      const initialText = fixture.debugElement.query(By.css('.cover-initial'));
      expect(initialText.nativeElement.textContent.trim()).toBe('D');
    });
  });
});
