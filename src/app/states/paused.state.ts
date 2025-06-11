import { ViewState } from '../interfaces/view-state.interface';
import { ViewStateEnum } from '../enums/view-state.enum';

export class PausedState implements ViewState {
  fromState?: ViewState;
  currentState = ViewStateEnum.Paused;

  constructor(fromState?: ViewState) {
    this.fromState = fromState;
  }

  cameraButtonActive(): boolean {
    return true; // Can always go to camera view from paused
  }

  screenshareButtonActive(): boolean {
    return true; // Can always go to screenshare view from paused
  }

  pauseButtonActive(): boolean {
    return false; // Already paused
  }
}
