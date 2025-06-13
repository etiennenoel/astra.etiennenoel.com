import {Inject, Injectable} from '@angular/core';
import {FormControl} from '@angular/forms';
import {
  RMS_HISTORY_LENGTH,
  SILENCE_ENTRY_THRESHOLD_RMS, SILENCE_ENTRY_THRESHOLD_ZCR,
  SILENCE_EXIT_THRESHOLD_RMS, SILENCE_EXIT_THRESHOLD_ZCR, SILENT_DURATION_MS, ZCR_HISTORY_LENGTH
} from '../constants/silence-detection-parameters.constants';
import {Subscription} from 'rxjs';
import {SilenceDetectionParameters} from '../interfaces/silence-detection-parameters.interface';

@Injectable({
  providedIn: "root",
})
export class DetectionParametersProvider implements SilenceDetectionParameters {
  get silenceEntryThresholdRMS(): number {
    return this.silenceEntryThresholdRMSFormControl.value ?? SILENCE_ENTRY_THRESHOLD_RMS;
  }

  silenceEntryThresholdRMSFormControl = new FormControl<number>(SILENCE_ENTRY_THRESHOLD_RMS);

  get silenceExitThresholdRMS(): number {
    return this.silenceExitThresholdRMSFormControl.value ?? SILENCE_EXIT_THRESHOLD_RMS;
  }

  silenceExitThresholdRMSFormControl = new FormControl<number>(SILENCE_EXIT_THRESHOLD_RMS);

  get silenceEntryThresholdZCR(): number {
    return this.silenceEntryThresholdZCRFormControl.value ?? SILENCE_ENTRY_THRESHOLD_ZCR;
  }

  silenceEntryThresholdZCRFormControl = new FormControl<number>(SILENCE_ENTRY_THRESHOLD_ZCR);

  get silenceExitThresholdZCR(): number {
    return this.silenceExitThresholdZCRFormControl.value ?? SILENCE_EXIT_THRESHOLD_ZCR;
  }

  silenceExitThresholdZCRFormControl = new FormControl<number>(SILENCE_EXIT_THRESHOLD_ZCR);

  get silenceDurationMs(): number {
    return this.silenceDurationMsFormControl.value ?? SILENT_DURATION_MS;
  }

  silenceDurationMsFormControl = new FormControl<number>(SILENT_DURATION_MS);

  get rmsHistoryLength(): number {
    return this.rmsHistoryLengthFormControl.value ?? RMS_HISTORY_LENGTH;
  }

  rmsHistoryLengthFormControl = new FormControl<number>(RMS_HISTORY_LENGTH);

  get zcrHistoryLength(): number {
    return this.zcrHistoryLengthFormControl.value ?? ZCR_HISTORY_LENGTH;
  }

  zcrHistoryLengthFormControl = new FormControl<number>(ZCR_HISTORY_LENGTH);

  subscriptions: Subscription[] = [];

  constructor() {
    this.subscriptions.push(this.silenceEntryThresholdRMSFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("silenceEntryThresholdRMS", value.toString());
      }));
    this.subscriptions.push(this.silenceExitThresholdRMSFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("silenceExitThresholdRMS", value.toString());
      }));

    this.subscriptions.push(this.silenceEntryThresholdZCRFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("silenceEntryThresholdZCR", value.toString());
      }));

    this.subscriptions.push(this.silenceExitThresholdZCRFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("silenceExitThresholdZCR", value.toString());
      }));

    this.subscriptions.push(this.silenceDurationMsFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("silenceDurationMs", value.toString());
      }));

    this.subscriptions.push(this.rmsHistoryLengthFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("rmsHistoryLength", value.toString());
      }));

    this.subscriptions.push(this.zcrHistoryLengthFormControl.valueChanges.subscribe(value => {
        if (value === null || value === undefined) {
          return;
        }
        localStorage.setItem("zcrHistoryLength", value.toString());
      }));

    this.loadLocalStorageOverrides();
  }

  loadLocalStorageOverrides(): void {
    const silenceEntryThresholdRMS = localStorage.getItem("silenceEntryThresholdRMS");
    if (silenceEntryThresholdRMS) {
      this.silenceEntryThresholdRMSFormControl.setValue(parseFloat(silenceEntryThresholdRMS));
    }

    const silenceExitThresholdRMS = localStorage.getItem("silenceExitThresholdRMS");
    if (silenceExitThresholdRMS) {
      this.silenceExitThresholdRMSFormControl.setValue(parseFloat(silenceExitThresholdRMS));
    }

    const silenceEntryThresholdZCR = localStorage.getItem("silenceEntryThresholdZCR");
    if (silenceEntryThresholdZCR) {
      this.silenceEntryThresholdZCRFormControl.setValue(parseFloat(silenceEntryThresholdZCR));
    }

    const silenceExitThresholdZCR = localStorage.getItem("silenceExitThresholdZCR");
    if (silenceExitThresholdZCR) {
      this.silenceExitThresholdZCRFormControl.setValue(parseFloat(silenceExitThresholdZCR));
    }

    const silenceDurationMs = localStorage.getItem("silenceDurationMs");
    if (silenceDurationMs) {
      this.silenceDurationMsFormControl.setValue(parseInt(silenceDurationMs, 10));
    }

    const rmsHistoryLength = localStorage.getItem("rmsHistoryLength");
    if (rmsHistoryLength) {
      this.rmsHistoryLengthFormControl.setValue(parseInt(rmsHistoryLength, 10));
    }

    const zcrHistoryLength = localStorage.getItem("zcrHistoryLength");
    if (zcrHistoryLength) {
      this.zcrHistoryLengthFormControl.setValue(parseInt(zcrHistoryLength, 10));
    }
  }
}
