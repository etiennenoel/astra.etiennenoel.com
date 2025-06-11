import {AfterViewInit, Component, Inject, Input, OnInit, PLATFORM_ID} from '@angular/core';
import {EventStore} from '../../stores/event.store';
import {DOCUMENT, isPlatformServer} from '@angular/common';
import {BaseComponent} from '../base/base.component';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: false,
  styleUrl: './footer.component.scss'
})
export class FooterComponent extends BaseComponent implements OnInit, AfterViewInit {

  @Input()
  isPaused = true

  @Input()
  isCameraOn = false;

  @Input()
  isScreenshareOn = false;

  detectSilenceFormControl = new FormControl<boolean>(true);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
  ) {
    super(document)
  }

  override ngOnInit() {
    super.ngOnInit();

    if(isPlatformServer(this.platformId)) {
      return;
    }

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




  }

  ngAfterViewInit(): void {
    if(isPlatformServer(this.platformId)) {
      return;
    }

    // const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    // // @ts-expect-error
    // const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  }

  captureContext() {
    this.eventStore.captureContext.next(true);
  }

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.isCameraOn = false;
    }

    this.eventStore.isPaused.next(this.isPaused);
  }

  toggleCamera() {
    this.isCameraOn = !this.isCameraOn;
    this.eventStore.isCameraOn.next(this.isCameraOn); // Dispatch the event
    this.isScreenshareOn = false;
  }

  toggleScreenshare() {
    this.isScreenshareOn = !this.isScreenshareOn;
    this.eventStore.isScreenshareOn.next(this.isScreenshareOn); // Dispatch the event
  }

  exit() {
    this.window?.location.reload();
  }
}
