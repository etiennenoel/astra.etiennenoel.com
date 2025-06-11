import {ViewStateInterface} from '../interfaces/view-state.interface';
import {ViewStateEnum} from '../enums/view-state.enum';
import {StateContext} from './state.context';
import {EventStore} from "../stores/event.store";

export class CameraViewState implements ViewStateInterface {
    currentStateEnum = ViewStateEnum.CameraView;

    constructor(
      private readonly stateContext: StateContext,
      private readonly eventStore: EventStore,
      ) {
    }

  entering(from?: ViewStateEnum): void {
    }
    exiting(to: ViewStateEnum): void {
    }

    cameraButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
        return "white";
    }

    screenshareButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
        return "transparent";
    }

    pauseButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
        return "transparent";
    }

    processContextButtonColor(): 'transparent' | 'white' | 'red' | 'blue' {
        return "blue";
    }

    // Icons
    cameraButtonIcon(): string {
        return "bi-camera-video";
    }

    screenshareButtonIcon(): string {
        return "bi-window-plus";
    }

    pauseButtonIcon(): string {
        return "bi-pause-fill"
    }

    processContextButtonIcon(): string {
        return "bi-circle";
    }

    // Active State
    processContextButtonActive(): boolean {
        return true;
    }

    cameraButtonActive(): boolean {
        return true;
    }

    screenshareButtonActive(): boolean {
        return true;
    }

    pauseButtonActive(): boolean {
        return true;
    }

    // Button actions
  pauseButtonClicked(): void {
    this.stateContext.transition(ViewStateEnum.Paused);
  }

  cameraButtonClicked(): void {
    // Do nothing
  }

  screenshareButtonClicked(): void {
    this.stateContext.transition(ViewStateEnum.ScreenshareView)
  }

  processContextButtonClicked(): void {
    this.eventStore.captureContext.next(true);
  }
}
