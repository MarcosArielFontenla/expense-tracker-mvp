import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-not-found',
    imports: [CommonModule, RouterModule],
    templateUrl: './not-found.html',
    styleUrl: './not-found.css',
    standalone: true
})
export class NotFound { }
