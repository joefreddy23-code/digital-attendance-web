import { Component, inject } from '@angular/core';

import { LoaderService } from '../../services/loader/loader';

@Component({
  selector: 'app-global-loader',
  templateUrl: './global-loader.html',
  styleUrl: './global-loader.css',
})
export class GlobalLoader {
  readonly loader = inject(LoaderService);
}
