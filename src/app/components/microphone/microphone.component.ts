import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-microphone',
  standalone: false,
  templateUrl: './microphone.component.html',
  styleUrls: ['./microphone.component.scss']
})
export class MicrophoneComponent {
  @Input() isListening: boolean = true;
  @Output() toggleListen = new EventEmitter<void>();

  constructor() { }

  onToggleListen() {
    this.toggleListen.emit();
  }
}
