import {AfterViewInit, Component, Inject, Input, OnInit, PLATFORM_ID} from '@angular/core';
import {EventStore} from '../../stores/event.store';
import {DOCUMENT, isPlatformServer} from '@angular/common';
import {BaseComponent} from '../base/base.component';
import {FormControl} from '@angular/forms';
import {StateContext} from '../../states/state.context';
import {ViewStateInterface} from '../../interfaces/view-state.interface';
import {Router} from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: false,
  styleUrl: './footer.component.scss'
})
export class FooterComponent extends BaseComponent implements OnInit {
  state!: ViewStateInterface;
  showAudioParametersForm: boolean = false;

  detectSilenceFormControl = new FormControl<boolean>(true);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
    private readonly stateContext: StateContext,
    private readonly router: Router,
  ) {
    super(document)
  }

  override ngOnInit() {
    super.ngOnInit();

    if(isPlatformServer(this.platformId)) {
      return;
    }

    this.subscriptions.push(this.stateContext.currentState$.subscribe(value => {
      if(!value) {
        return;
      }

      this.state = value;
    }))

    this.subscriptions.push(this.detectSilenceFormControl.valueChanges.subscribe(value => {
      if(value === null) {
        return;
      }

      localStorage.setItem("detectSilence", value + "")

      if (value) {
        this.eventStore.detectSilence.next(true); // Emit true to start detecting silence
      } else {
        this.eventStore.detectSilence.next(false); // Emit false to stop detecting silence
      }
    }))

    // Restore the default value of detectSilence from localStorage
    const storedValue = localStorage.getItem("detectSilence");
    if (storedValue !== null) {
      this.detectSilenceFormControl.setValue(storedValue === 'true');
    } else {
      this.detectSilenceFormControl.setValue(true); // Default to true if not set
    }

    // Restore the showAudioParametersForm value from localStorage
    const showAudioParametersForm = localStorage.getItem("showAudioParametersForm");
    if (showAudioParametersForm !== null) {
      this.showAudioParametersForm = showAudioParametersForm === 'true';
    } else {
      this.showAudioParametersForm = false; // Default to false if not set
    }
  }

  captureContext() {
    this.eventStore.captureContext.next(true);
  }

  togglePause() {
    this.state.pauseButtonClicked();
  }

  toggleCamera() {
    this.state.cameraButtonClicked();
  }

  toggleScreenshare() {
    this.state.screenshareButtonClicked();
  }

  exit() {
    this.state.pauseButtonClicked()
    this.router.navigateByUrl("/");
  }

  public toggleAudioParametersForm(): void {
    this.showAudioParametersForm = !this.showAudioParametersForm;

    // SAve to localStorage
    localStorage.setItem("showAudioParametersForm", this.showAudioParametersForm.toString());
  }
}
