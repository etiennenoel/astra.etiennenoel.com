import { ViewState } from '../interfaces/view-state.interface';
import { ViewStateEnum } from '../enums/view-state.enum';

export class ScreenshareViewState implements ViewState {
  fromState?: ViewState;
  currentState = ViewStateEnum.ScreenshareView;

  constructor(fromState?: ViewState) {
    this.fromState = fromState;
  }

  cameraButtonActive(): boolean {
    return true; // Can switch to camera
  }

  screenshareButtonActive(): boolean {
    return false; // Already in screenshare view
  }

  pauseButtonActive(): boolean {
    return true; // Can pause
  }
}
