import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StateMachineService } from '../../services/state-machine.service';
import { ViewState } from '../../interfaces/view-state.interface';
import { ViewStateEnum } from '../../enums/view-state.enum';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: false, // As per instructions.md
})
export class FooterComponent implements OnInit, OnDestroy {
  isCameraActive = false;
  isScreenshareActive = false;
  isPauseActive = false;

  private stateSubscription: Subscription | undefined;
  currentViewState: ViewState | undefined;

  constructor(
    private router: Router,
    private stateMachineService: StateMachineService
  ) {}

  ngOnInit(): void {
    this.stateSubscription = this.stateMachineService.currentViewState$.subscribe(
      (state: ViewState) => {
        this.currentViewState = state;
        this.isCameraActive = state.cameraButtonActive();
        this.isScreenshareActive = state.screenshareButtonActive();
        this.isPauseActive = state.pauseButtonActive();

        // Navigate based on state, if needed by other parts of your application
        // For now, we just update button states.
        // Example:
        // if (state.currentState === ViewStateEnum.CameraView) {
        //   this.router.navigate(['/camera']);
        // } else if (state.currentState === ViewStateEnum.ScreenshareView) {
        //   this.router.navigate(['/screenshare']);
        // } else {
        //   // Potentially navigate to a home/paused view if that exists
        //   // this.router.navigate(['/']);
        // }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  onCameraClick(): void {
    if (this.currentViewState?.currentState === ViewStateEnum.CameraView) {
      // If already in camera view, clicking again might mean going to pause, or do nothing
      // Based on current design, it means going to Paused state.
      this.stateMachineService.pause();
      this.router.navigate(['/']); // Navigate to home/paused route
    } else {
      this.stateMachineService.startCameraView();
      this.router.navigate(['/camera']);
    }
  }

  onScreenshareClick(): void {
    if (this.currentViewState?.currentState === ViewStateEnum.ScreenshareView) {
      // If already in screenshare view, clicking again might mean going to pause
      this.stateMachineService.pause();
      this.router.navigate(['/']); // Navigate to home/paused route
    } else {
      this.stateMachineService.startScreenshareView();
      this.router.navigate(['/screenshare']);
    }
  }

  onPauseClick(): void {
    // Pause button should transition to the Paused state.
    // The PausedState will determine where to go next if another button is clicked.
    this.stateMachineService.pause();
    this.router.navigate(['/']); // Navigate to home/paused route
  }

  // Utility to easily check current state in template if needed, though properties are preferred
  isState(stateName: ViewStateEnum): boolean {
    return this.currentViewState?.currentState === stateName;
  }
}
