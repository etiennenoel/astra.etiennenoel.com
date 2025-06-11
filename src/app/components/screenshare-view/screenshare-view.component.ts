import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ScreenshareRecordingService } from '../../services/screenshare-recording.service'; // Corrected path
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-screenshare-view',
  standalone: false,
  templateUrl: './screenshare-view.component.html',
  styleUrls: ['./screenshare-view.component.scss']
})
export class ScreenshareViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('screenshareVideo') videoElementRef!: ElementRef<HTMLVideoElement>;
  private messageSubscription!: Subscription;
  public currentMessage: string = '';

  constructor(public screenshareService: ScreenshareRecordingService) { } // Made public for template access if needed

  ngOnInit(): void {
    this.messageSubscription = this.screenshareService.messageEmitter.subscribe((message: string) => {
      this.currentMessage = message;
      console.log('ScreenshareViewComponent message:', message); // Or display it in the template
    });
  }

  ngAfterViewInit(): void {
    this.startScreenShare();
  }

  async startScreenShare() {
    if (this.videoElementRef && this.videoElementRef.nativeElement) {
      try {
        await this.screenshareService.startScreenShare(this.videoElementRef.nativeElement);
        this.currentMessage = 'Screen sharing started.';
      } catch (err) {
        // Error is already handled and emitted by the service
        // this.currentMessage will be updated by the messageEmitter subscription
        console.error("Error in component while starting screen share: ", err);
      }
    } else {
      this.currentMessage = 'Video element not ready.';
      console.error('Screenshare video element not found.');
    }
  }

  stopScreenShare(): void {
    this.screenshareService.stopScreenShare();
    // Message will be updated by the messageEmitter subscription
  }

  ngOnDestroy(): void {
    this.stopScreenShare(); // Ensure stream is stopped when component is destroyed
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
