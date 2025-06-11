import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ViewState } from '../interfaces/view-state.interface';
import { PausedState } from '../states/paused.state';
import { CameraViewState } from '../states/camera-view.state';
import { ScreenshareViewState } from '../states/screenshare-view.state';
import { ViewStateEnum } from '../enums/view-state.enum';

@Injectable({
  providedIn: 'root',
})
export class StateMachineService {
  private _currentViewState: BehaviorSubject<ViewState>;
  public readonly currentViewState$: Observable<ViewState>;

  constructor() {
    // Initial state is Paused
    this._currentViewState = new BehaviorSubject<ViewState>(new PausedState());
    this.currentViewState$ = this._currentViewState.asObservable();
  }

  public transitionToState(newState: ViewStateEnum): void {
    const oldState = this._currentViewState.value;
    let nextState: ViewState;

    switch (newState) {
      case ViewStateEnum.Paused:
        nextState = new PausedState(oldState);
        break;
      case ViewStateEnum.CameraView:
        nextState = new CameraViewState(oldState);
        break;
      case ViewStateEnum.ScreenshareView:
        nextState = new ScreenshareViewState(oldState);
        break;
      default:
        console.error('Unknown state transition', newState);
        return;
    }
    this._currentViewState.next(nextState);
  }

  // Convenience methods for transitions
  public pause(): void {
    this.transitionToState(ViewStateEnum.Paused);
  }

  public startCameraView(): void {
    this.transitionToState(ViewStateEnum.CameraView);
  }

  public startScreenshareView(): void {
    this.transitionToState(ViewStateEnum.ScreenshareView);
  }
}
