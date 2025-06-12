import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventStore {
  public readonly isPaused = new BehaviorSubject<void | boolean>(false);

  public readonly captureContext = new BehaviorSubject<void | boolean>(undefined);

  public readonly transcriptionAvailable = new BehaviorSubject<void | string>(undefined);

  public readonly agentResponseAvailable = new BehaviorSubject<void | string>(undefined);

  public readonly isProcessing = new BehaviorSubject<void | boolean>(undefined);

  public readonly silenceDetected = new BehaviorSubject<void | boolean>(undefined);

  public readonly detectSilence = new BehaviorSubject<boolean>(false);
}
