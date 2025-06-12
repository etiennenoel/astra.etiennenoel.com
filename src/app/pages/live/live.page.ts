import {Component, ViewChild, AfterViewInit, Inject, OnInit} from '@angular/core';
import {CameraViewComponent} from '../../components/camera-view/camera-view.component';
import {BaseComponent} from '../../components/base/base.component';
import {DOCUMENT} from '@angular/common';
import {EventStore} from '../../stores/event.store';
import {ContextManager} from '../../managers/context.manager';
import {PromptManager} from '../../managers/prompt.manager';
import {ToastStore} from '../../stores/toast.store';
import {StateContext} from '../../states/state.context';
import {ViewStateInterface} from '../../interfaces/view-state.interface';
import {ViewStateEnum} from '../../enums/view-state.enum';

// MicrophoneComponent is not needed for ViewChild access if interaction is only through Input/Output

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './live.page.html',
  styleUrls: ['./live.page.scss'],
  host:{"class": "home"},
})
export class LivePage extends BaseComponent implements OnInit {
  isPaused: boolean = false;

  state?: ViewStateInterface;

  constructor(
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
    private readonly toastStore: ToastStore,
    private readonly contextManager: ContextManager,
    private readonly promptManager: PromptManager,
    private readonly stateContext: StateContext,
  ) {
    super(document);
  }

  override ngOnInit() {
    super.ngOnInit();

    this.subscriptions.push(this.stateContext.currentState$.subscribe(value => {
      this.state = value;
    }))
  }

  /**
   * @deprecated
   * @param message
   */
  handleCameraMessage(message: string) {
    this.showMessage(message);
  }

  showMessage(message: string) {
    this.toastStore.publish({
      message,
      position: 'bottom'
    })
  }

  protected readonly ViewStateEnum = ViewStateEnum;
}
