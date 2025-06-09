import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-microphone-view',
  standalone: false,
  templateUrl: './microphone-view.component.html',
  styleUrls: ['./microphone-view.component.scss']
})
export class MicrophoneViewComponent {
  @Input() isListening: boolean = true; // Default value, will be overridden by parent

  constructor() { }
}
