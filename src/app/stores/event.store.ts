import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventStore {
  public readonly recordingStatus = new BehaviorSubject<void | boolean>(undefined);
}
