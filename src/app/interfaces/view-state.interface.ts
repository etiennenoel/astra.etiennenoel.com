import { ViewStateEnum } from '../enums/view-state.enum';

export interface ViewStateInterface {
  currentStateEnum: ViewStateEnum;

  entering(from?: ViewStateEnum): void;
  exiting(to: ViewStateEnum): void;

  // Button active states
  cameraButtonActive(): boolean;
  screenshareButtonActive(): boolean;
  pauseButtonActive(): boolean;
  processContextButtonActive(): boolean;

  // Button colors
  cameraButtonColor():  "transparent" | "white" | "red" | "blue";
  screenshareButtonColor(): "transparent" | "white" | "red" | "blue";
  pauseButtonColor(): "transparent" | "white" | "red" | "blue";
  processContextButtonColor(): "transparent" | "white" | "red" | "blue";

  // Button icons
  cameraButtonIcon(): string;
  screenshareButtonIcon(): string;
  pauseButtonIcon(): string;
  processContextButtonIcon(): string;

  // Actions
  pauseButtonClicked(): void;
  cameraButtonClicked(): void;
  screenshareButtonClicked(): void;
  processContextButtonClicked(): void;
}
