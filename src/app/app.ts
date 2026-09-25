import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { GlobalLoader } from '../shared/components/global-loader/global-loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('attendWebApp');
}
