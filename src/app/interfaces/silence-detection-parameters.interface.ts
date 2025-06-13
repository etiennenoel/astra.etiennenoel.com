/**
 * Parameters for the advanced silence detection algorithm.
 */
interface SilenceDetectionParameters {
  /**
   * The RMS threshold below which silence *might* be detected (entering silence state).
   * Range: 0.0 to 1.0. Lower values mean less sensitive to noise.
   */
  silenceEntryThresholdRMS: number;
  /**
   * The RMS threshold above which the system *exits* the silence state.
   * Should be greater than or equal to silenceEntryThresholdRMS for hysteresis.
   * Range: 0.0 to 1.0.
   */
  silenceExitThresholdRMS: number;
  /**
   * The Zero-Crossing Rate threshold below which silence *might* be detected.
   * Normalized: 0.0 to 1.0 (0% to 100% of maximum possible zero crossings for the buffer size).
   * Lower values indicate flatter, less complex signals (more like silence).
   */
  silenceEntryThresholdZCR: number;
  /**
   * The Zero-Crossing Rate threshold above which the system *exits* the silence state.
   * Should be greater than or equal to silenceEntryThresholdZCR.
   * Normalized: 0.0 to 1.0.
   */
  silenceExitThresholdZCR: number;
  /**
   * The duration (in milliseconds) for which the audio must continuously meet
   * the silence criteria before silence is officially detected.
   */
  silenceDurationMs: number;
  /**
   * The number of recent RMS values to keep and average for smoothing.
   */
  rmsHistoryLength: number;
  /**
   * The number of recent ZCR values to keep and average for smoothing.
   */
  zcrHistoryLength: number;
}