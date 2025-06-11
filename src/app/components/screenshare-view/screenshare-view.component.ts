import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-screenshare-view',
  standalone: false,
  templateUrl: './screenshare-view.component.html',
  styleUrls: ['./screenshare-view.component.scss']
})
export class ScreenshareViewComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  async startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    } catch (err) {
      console.error("Error: " + err);
    }
  }
}
