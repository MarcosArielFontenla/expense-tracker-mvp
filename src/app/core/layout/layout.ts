import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Sidebar } from './sidebar/sidebar';

@Component({
    selector: 'app-layout',
    imports: [CommonModule, RouterModule, Sidebar],
    templateUrl: './layout.html',
    styleUrl: './layout.css',
    standalone: true
})
export class Layout { }
