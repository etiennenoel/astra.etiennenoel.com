import { Component } from '@angular/core';
import {DetectionParametersProvider} from '../../providers/detection-parameters.provider';

@Component({
  selector: 'app-audio-parameters-form',
  templateUrl: './audio-parameters-form.component.html',
  styleUrls: ['./audio-parameters-form.component.scss'],
  standalone: false,
})
export class AudioParametersFormComponent {
  constructor(protected readonly detectionParametersProvider: DetectionParametersProvider) {
  }
}
