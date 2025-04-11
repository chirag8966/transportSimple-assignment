import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeComponent } from './components/common/theme/theme.component';
import { CitySelectorComponent } from './components/city-selector/city-selector.component';
import { TripVisualizerComponent } from './components/trip-visualizer/trip-visualizer.component';
import { ProblemStatementComponent } from './components/problem-statement/problem-statement.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ThemeComponent, CitySelectorComponent, TripVisualizerComponent, ProblemStatementComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  protected title = 'transportSimple';
  protected tripPoints: { start: string; end: string } | null = null;

  onTripPoints(tripPoints: { start: string; end: string }) {
    this.tripPoints = tripPoints;
  }
}
