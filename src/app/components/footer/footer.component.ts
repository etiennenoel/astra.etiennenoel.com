import {AfterViewInit, Component, Inject, Input, PLATFORM_ID} from '@angular/core';
import {EventStore} from '../../stores/event.store';
import {DOCUMENT, isPlatformServer} from '@angular/common';
import {BaseComponent} from '../base/base.component';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: false,
  styleUrl: './footer.component.scss'
})
export class FooterComponent extends BaseComponent implements AfterViewInit {

  @Input()
  isPaused = true

  @Input()
  isCameraOn = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) document: Document,
    private readonly eventStore: EventStore,
  ) {
    super(document)
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
  }

  exit() {
    this.window?.location.reload();
  }
}
