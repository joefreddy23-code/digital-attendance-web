import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../components/sidebar/sidebar';
import { Topbar } from '../../components/topbar/topbar';

@Component({
  selector: 'app-main',
  imports: [Sidebar, Topbar, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
