import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (value === null || value === undefined) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    let processedValue = value
      .replace(/^###\s*(.*)$/gm, '<h4>$1</h4>')
      .replace(/^##\s*(.*)$/gm, '<h3>$1</h3>')
      .replace(/^#\s*(.*)$/gm, '<h2>$1</h2>')
      .replace(/^\*\s*(.*)$/gm, '<li>$1</li>');

    if (processedValue.includes('<li>')) {
      processedValue = processedValue.replace(/(<li>.*<\/li>(\n|.)*?)*<li>.*<\/li>/gs, '<ul>$&</ul>');
    }

    processedValue = processedValue.split('\n').map(line => {
      if (line.trim() === '' || line.match(/<[^>]*>/)) {
        return line;
      }
      return `<p>${line}</p>`;
    }).join('');


    return this.sanitizer.bypassSecurityTrustHtml(processedValue);
  }
}