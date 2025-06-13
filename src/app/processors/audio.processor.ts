import {EventStore} from '../stores/event.store';
import {Inject, Injectable} from '@angular/core';
import {DetectionParametersProvider} from '../providers/detection-parameters.provider';

/**
 * A class to handle audio processing and advanced silence detection.
 */
@Injectable()
export class AudioProcessor {
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  private silenceStartTime: number | undefined;
  private isCurrentlySilent: boolean = false; // Tracks the current state of silence
  private rmsHistory: number[] = [];
  private zcrHistory: number[] = [];

  private audioContext?: AudioContext;
  private animationFrameId?: number;

  constructor(
    private readonly eventStore: EventStore,
    private readonly detectionParams: DetectionParametersProvider
  ) {
    // Initial fill of history arrays with zeros
    for (let i = 0; i < this.detectionParams.rmsHistoryLength; i++) {
      this.rmsHistory.push(0);
    }
    for (let i = 0; i < this.detectionParams.zcrHistoryLength; i++) {
      this.zcrHistory.push(0);
    }
  }

  /**
   * Calculates the Root Mean Square (RMS) of the audio data.
   * @param data The Uint8Array from analyserNode.getByteTimeDomainData().
   * @returns The RMS value, normalized to 0.0 - 1.0.
   */
  private calculateRMS(data: Uint8Array): number {
    let sumSquares = 0.0;
    for (const amplitude of data) {
      // Normalize to -1 to 1 range
      const normalizedAmplitude = (amplitude / 128.0) - 1.0;
      sumSquares += normalizedAmplitude * normalizedAmplitude;
    }
    return Math.sqrt(sumSquares / data.length);
  }

  /**
   * Calculates the Zero-Crossing Rate (ZCR) of the audio data.
   * ZCR is the number of times the signal crosses the zero amplitude axis.
   * @param data The Uint8Array from analyserNode.getByteTimeDomainData().
   * @returns The normalized ZCR value (0.0 - 1.0).
   */
  private calculateZCR(data: Uint8Array): number {
    let zeroCrossings = 0;
    if (data.length < 2) {
      return 0;
    }

    // Convert Uint8Array values (0-255) to signed range (-128 to 127) for true zero crossing detection
    // The actual zero for getByteTimeDomainData is 128.
    // So, we are looking for sign changes relative to 128.
    for (let i = 1; i < data.length; i++) {
      const prevSign = data[i - 1] > 128 ? 1 : (data[i - 1] < 128 ? -1 : 0);
      const currentSign = data[i] > 128 ? 1 : (data[i] < 128 ? -1 : 0);

      if (prevSign !== currentSign && prevSign !== 0 && currentSign !== 0) {
        zeroCrossings++;
      }
    }
    // Normalize ZCR: Max possible zero crossings in N samples is N-1.
    // So, divide by data.length - 1 (or data.length for simplicity if data.length is large)
    // Here, using data.length ensures it's a ratio.
    return zeroCrossings / (data.length - 1);
  }

  /**
   * Pushes a new value into a history array and maintains its length.
   * @param history The array to update.
   * @param newValue The value to add.
   * @param maxLength The maximum length of the history array.
   */
  private updateHistory(history: number[], newValue: number, maxLength: number): void {
    history.push(newValue);
    if (history.length > maxLength) {
      history.shift(); // Remove the oldest value
    }
  }

  /**
   * Calculates the average of numbers in an array.
   * @param arr The array of numbers.
   * @returns The average value.
   */
  private getAverage(arr: number[]): number {
    if (arr.length === 0) {
      return 0;
    }
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  /**
   * This is the core function to be called periodically (e.g., in an animation frame loop
   * or a Web Audio API ScriptProcessorNode).
   * It checks for silence based on RMS, ZCR, history, and hysteresis.
   */
  public betterCheckForSilence(): void {
    if (!this.analyserNode || !this.dataArray) {
      console.warn("AnalyserNode or dataArray not initialized.");
      return;
    }

    this.analyserNode.getByteTimeDomainData(this.dataArray);

    const currentRMS = this.calculateRMS(this.dataArray);
    const currentZCR = this.calculateZCR(this.dataArray);

    this.updateHistory(this.rmsHistory, currentRMS, this.detectionParams.rmsHistoryLength);
    this.updateHistory(this.zcrHistory, currentZCR, this.detectionParams.zcrHistoryLength);

    const averagedRMS = this.getAverage(this.rmsHistory);
    const averagedZCR = this.getAverage(this.zcrHistory);

    const isBelowRMSThreshold = averagedRMS < this.detectionParams.silenceEntryThresholdRMS;
    const isBelowZCRThreshold = averagedZCR < this.detectionParams.silenceEntryThresholdZCR;

    const isAboveRMSExitThreshold = averagedRMS > this.detectionParams.silenceExitThresholdRMS;
    const isAboveZCRExitThreshold = averagedZCR > this.detectionParams.silenceExitThresholdZCR;

    if (this.isCurrentlySilent) {
      // We are currently in a silent state, check if we should exit silence
      if (isAboveRMSExitThreshold || isAboveZCRExitThreshold) {
        // Sound detected, reset timer and exit silence state
        this.silenceStartTime = undefined;
        this.isCurrentlySilent = false;
        this.eventStore.silenceDetected.next(false); // Signal end of silence
        console.log(`Exiting silence: RMS=${averagedRMS.toFixed(3)} (Exit: ${this.detectionParams.silenceExitThresholdRMS.toFixed(3)}), ZCR=${averagedZCR.toFixed(3)} (Exit: ${this.detectionParams.silenceExitThresholdZCR.toFixed(3)})`);
      }
      // If still silent, do nothing (no need to re-emit true)
    } else {
      // We are currently not in a silent state, check if we should enter silence
      if (isBelowRMSThreshold && isBelowZCRThreshold) {
        if (this.silenceStartTime === undefined) {
          // Start timer for potential silence
          this.silenceStartTime = Date.now();
          console.log(`Potential silence started. RMS=${averagedRMS.toFixed(3)} (Entry: ${this.detectionParams.silenceEntryThresholdRMS.toFixed(3)}), ZCR=${averagedZCR.toFixed(3)} (Entry: ${this.detectionParams.silenceEntryThresholdZCR.toFixed(3)})`);
        } else if (Date.now() - this.silenceStartTime > this.detectionParams.silenceDurationMs) {
          // Silence duration reached, confirm silence
          this.isCurrentlySilent = true;
          this.eventStore.silenceDetected.next(true); // Signal silence detected
          console.log(`Silence DETECTED! RMS=${averagedRMS.toFixed(3)}, ZCR=${averagedZCR.toFixed(3)}`);
          // Note: silenceStartTime is NOT reset here; it persists until sound is detected to exit silence.
          // This allows for continuous silence detection without re-triggering if already silent.
        }
      } else {
        // Sound detected before silence duration, reset timer
        if (this.silenceStartTime !== undefined) {
          console.log(`Sound detected, resetting silence timer. RMS=${averagedRMS.toFixed(3)}, ZCR=${averagedZCR.toFixed(3)}`);
        }
        this.silenceStartTime = undefined;
        this.eventStore.silenceDetected.next(false);

      }
    }
  }

  // Example of how to start monitoring (e.g., in a requestAnimationFrame loop)
  public startMonitoring(audioContext: AudioContext,
                         analyserNode: AnalyserNode
                         ): void {
    this.audioContext = audioContext;
    this.analyserNode = analyserNode
    this.analyserNode.fftSize = 2048; // A common size, determines dataArray length
    this.dataArray = new Uint8Array(this.analyserNode.fftSize);

    const loop = () => {
      this.betterCheckForSilence();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  // Example of how to stop monitoring
  public stopMonitoring(): void {
    if(this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = undefined;
    }

    this.disconnect()
  }

  // Dummy method to clean up (e.g., disconnect analyser node)
  public disconnect(): void {
    this.dataArray = null;
  }
}
