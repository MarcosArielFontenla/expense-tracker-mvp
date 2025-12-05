import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OnboardingOverlay } from './shared/components/onboarding-overlay/onboarding-overlay';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OnboardingOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('expense-tracker-mvp');
}
