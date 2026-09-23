import { Component, OnInit } from '@angular/core';
import { KeepAliveService } from './services/keep-alive.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'DevJournal';

  constructor(private keepAliveService: KeepAliveService) {}

  ngOnInit(): void {
    this.keepAliveService.startKeepAlive();
  }
}
