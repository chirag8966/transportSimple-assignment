import { Component, EventEmitter, Output } from '@angular/core';
import { InputFieldComponent } from '../common/input-field/input-field.component';
import { ButtonComponent } from '../common/button/button.component';
import { InputFieldConfig } from './models';

@Component({
  selector: 'app-city-selector',
  standalone: true,
  imports: [InputFieldComponent, ButtonComponent],
  templateUrl: './city-selector.component.html',
  styleUrl: './city-selector.component.scss'
})
export class CitySelectorComponent {
  protected inputFieldConfig: InputFieldConfig[] = [
    {
      label: 'Start Point',
      placeholder: 'Enter Start Point',
      type: 'text',
      required: true,
      value: '',
      id: 'startPoint'
    },
    {
      label: 'End Point',
      placeholder: 'Enter End Point',
      type: 'text',
      required: true,
      value: '',
      id: 'endPoint'
    },
  ];
  @Output() tripPoints: EventEmitter<{ start: string; end: string }> = new EventEmitter();

  addToTrip(event: Event) {
    event.preventDefault();
    const [start, end] = this.inputFieldConfig.map((field) => field.value);
    this.tripPoints.emit({
      start,
      end
    });
    this.resetForm();
    this.shiftInputFocus();
  }

  resetForm() {
    this.inputFieldConfig.forEach((field) => {
      field.value = '';
    });
  }

  shiftInputFocus() {
    const startInput = document.getElementById('startPoint');
    startInput?.focus();
  }
}
