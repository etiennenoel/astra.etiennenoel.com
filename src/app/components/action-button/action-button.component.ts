import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.component.html',
  standalone: false,
  styleUrl: './action-button.component.scss'
})
export class ActionButtonComponent {
  @Input()
  icon?: string;

  @Input()
  color: "transparent" | "white" | "red" = "transparent"

  @Input()
  disabled = false;
}
