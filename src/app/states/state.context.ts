import {Injectable} from '@angular/core';
import {ViewStateInterface} from '../interfaces/view-state.interface';
import {ViewStateEnum} from '../enums/view-state.enum';
import {CameraViewState} from './camera-view.state';
import {ScreenshareViewState} from './screenshare-view.state';
import {PausedState} from './paused.state';
import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';
import {EventStore} from '../stores/event.store';
import {MicrophoneViewState} from './microphone-view.state';

@Injectable({
  providedIn: "root"
})
export class StateContext {

  previousState?: ViewStateInterface | undefined;

  currentState!: ViewStateInterface;

  currentState$: BehaviorSubject<ViewStateInterface | undefined> = new BehaviorSubject<ViewStateInterface | undefined>(undefined);

  get currentStateEnum(): ViewStateEnum {
    return this.currentState.currentStateEnum;
  }

  set currentStateEnum(value: ViewStateEnum) {
    this.transition(value);
  }

  constructor(private readonly eventStore: EventStore) {
    this.transition(ViewStateEnum.MicrophoneView);
  }

  transition(viewState: ViewStateEnum) {
    if(this.currentState && this.currentState.currentStateEnum === viewState) {
      return;
    }

    this.previousState = this.currentState;
    this.previousState?.exiting(viewState);

    switch (viewState) {
      case ViewStateEnum.CameraView:
        this.currentState = new CameraViewState(this, this.eventStore);
        break;
      case ViewStateEnum.ScreenshareView:
        this.currentState = new ScreenshareViewState(this, this.eventStore);
        break;
      case ViewStateEnum.Paused:
        this.currentState = new PausedState(this, this.eventStore);
        break;
      case ViewStateEnum.MicrophoneView:
        this.currentState = new MicrophoneViewState(this, this.eventStore);
        break;
      default:
        throw new Error(`Unknown view state: ${viewState}`);
    }

    this.currentState.entering(this.previousState?.currentStateEnum);
    this.currentState$.next(this.currentState);
  }

}
