import { ViewStateEnum } from '../enums/view-state.enum';

export interface ViewState {
  fromState?: ViewState; // Optional because the initial state won't have a fromState
  currentState: ViewStateEnum;
  cameraButtonActive(): boolean;
  screenshareButtonActive(): boolean;
  pauseButtonActive(): boolean;
}
