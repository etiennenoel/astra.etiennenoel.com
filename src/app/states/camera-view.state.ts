import { ViewState } from '../interfaces/view-state.interface';
import { ViewStateEnum } from '../enums/view-state.enum';

export class CameraViewState implements ViewState {
  fromState?: ViewState;
  currentState = ViewStateEnum.CameraView;

  constructor(fromState?: ViewState) {
    this.fromState = fromState;
  }

  cameraButtonActive(): boolean {
    return false; // Already in camera view
  }

  screenshareButtonActive(): boolean {
    return true; // Can switch to screenshare
  }

  pauseButtonActive(): boolean {
    return true; // Can pause
  }
}
