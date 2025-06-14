import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ScreenshareRecordingService } from '../../services/screenshare-recording.service'; // Corrected path
import { Subscription } from 'rxjs';
import {ToastStore} from '../../stores/toast.store';

@Component({
  selector: 'app-screenshare-view',
  standalone: false,
  templateUrl: './screenshare-view.component.html',
  styleUrls: ['./screenshare-view.component.scss']
})
export class ScreenshareViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('screenshareVideo') videoElementRef!: ElementRef<HTMLVideoElement>;

  constructor(
    public screenshareService: ScreenshareRecordingService,
    public toastStore: ToastStore,
    ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.startScreenShare();
  }

  async startScreenShare() {
    if (this.videoElementRef && this.videoElementRef.nativeElement) {
      try {
        await this.screenshareService.startScreenShare(this.videoElementRef.nativeElement);
        this.toastStore.publish({message: 'Screen sharing started.'})
      } catch (err) {
        // Error is already handled and emitted by the service
        // this.currentMessage will be updated by the messageEmitter subscription
        console.error("Error in component while starting screen share: ", err);
      }
    } else {
      this.toastStore.publish({message: 'Video element not ready. Please ensure the video element is present in the DOM.'});
      console.error('Screenshare video element not found.');
    }
  }

  stopScreenShare(): void {
    this.screenshareService.stopScreenShare();
    // Message will be updated by the messageEmitter subscription
  }

  ngOnDestroy(): void {
    this.stopScreenShare(); // Ensure stream is stopped when component is destroyed
  }
}
