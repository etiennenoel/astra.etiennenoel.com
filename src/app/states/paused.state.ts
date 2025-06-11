import {ViewStateInterface} from '../interfaces/view-state.interface';
import {ViewStateEnum} from '../enums/view-state.enum';
import {StateContext} from './state.context';
import {EventStore} from "../stores/event.store";

export class PausedState implements ViewStateInterface {
  currentStateEnum = ViewStateEnum.Paused;

  previousStateEnum?: ViewStateEnum;

  constructor(
    private readonly stateContext: StateContext,
    private readonly eventStore: EventStore,
    ) {
  }

  entering(from?: ViewStateEnum): void {
    this.previousStateEnum = from;
    this.eventStore.isPaused.next(true);
  }
  exiting(to: ViewStateEnum): void {
    this.eventStore.isPaused.next(false);
  }

  cameraButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
    return "transparent";
  }

  screenshareButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
    return "transparent";
  }

  pauseButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
    return "transparent";
  }

  processContextButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
    return "transparent";
  }

  // Icons
  cameraButtonIcon(): string {
    return "bi-camera-video";
  }

  screenshareButtonIcon(): string {
    return "bi-window-plus";
  }

  pauseButtonIcon(): string {
    return "bi-soundwave"
  }

  processContextButtonIcon(): string {
    return "bi-circle";
  }

  // Active State
  processContextButtonActive(): boolean {
    return false;
  }

  cameraButtonActive(): boolean {
    return false;
  }

  screenshareButtonActive(): boolean {
    return false;
  }

  pauseButtonActive(): boolean {
    return true;
  }


  // Button actions
  pauseButtonClicked(): void {
    if(this.previousStateEnum) {
      this.stateContext.transition(this.previousStateEnum);
    } else {
      this.stateContext.transition(ViewStateEnum.MicrophoneView)
    }
  }

  cameraButtonClicked(): void {
    // Do nothing
  }

  screenshareButtonClicked(): void {
    // Do nothing
  }

  processContextButtonClicked(): void {
    // Do nothing
  }
}
