import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { ChatComponent } from './chat.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [ChatComponent, FormsModule, MarkdownModule.forRoot()],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render headings, lists, code blocks, and links via ngx-markdown and marked 15', async () => {
    component.messages = [
      {
        sender: 'ai',
        text: '# Heading 1\n## Heading 2\n\n- Item A\n- Item B\n\n```ts\nconst x = 1;\n```\n\n[DevJournal](https://example.com)'
      }
    ];
    fixture.detectChanges();
    await fixture.whenStable();

    const bubble: HTMLElement | null = fixture.nativeElement.querySelector('.message-bubble markdown');
    expect(bubble).toBeTruthy();
    expect(bubble?.querySelector('h1')?.textContent?.trim()).toBe('Heading 1');
    expect(bubble?.querySelector('h2')?.textContent?.trim()).toBe('Heading 2');
    const listItems = bubble?.querySelectorAll('ul li');
    expect(listItems?.length).toBe(2);
    expect(listItems?.[0].textContent?.trim()).toBe('Item A');
    expect(listItems?.[1].textContent?.trim()).toBe('Item B');
    const codeBlock = bubble?.querySelector('pre code.language-ts');
    expect(codeBlock).toBeTruthy();
    expect(codeBlock?.textContent).toContain('const x = 1;');
    const link = bubble?.querySelector('a') as HTMLAnchorElement | null;
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.textContent?.trim()).toBe('DevJournal');
  });
});
