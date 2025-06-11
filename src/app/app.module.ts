import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Added this line

import { AppRoutingModule } from './app-routing.module';
import {RootComponent} from './components/root/root.component';
import { HomeComponent } from './pages/home/home.component';
import {LayoutComponent} from './components/layout/layout.component';
import { CameraViewComponent } from './components/camera-view/camera-view.component';
import { MicrophoneViewComponent } from './components/microphone-view/microphone-view.component';
import {PromptManager} from './managers/prompt.manager';
import {AudioRecordingService} from './services/audio-recording.service';
import {AudioVisualizerService} from './services/audio-visualizer.service';
import { CameraRecordingService } from './services/camera-recording.service';
import { ScreenshareRecordingService } from './services/screenshare-recording.service'; // Added this line
import {FooterComponent} from './components/footer/footer.component';
import {ActionButtonComponent} from './components/action-button/action-button.component';
import {ContextManager} from './managers/context.manager';
import { MicrophoneVisualizerComponent } from './components/microphone-visualizer/microphone-visualizer.component';
import { ScreenshareViewComponent } from './components/screenshare-view/screenshare-view.component';

@NgModule({
  declarations: [
    LayoutComponent,
    RootComponent,

    ActionButtonComponent,
    FooterComponent,
    HomeComponent,
    CameraViewComponent,
    MicrophoneViewComponent,
    MicrophoneVisualizerComponent,
    ScreenshareViewComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule // Added this line
  ],
  providers: [
    provideClientHydration(withEventReplay()),

    // Managers
    ContextManager,
    PromptManager,

    // Services
    AudioRecordingService,
    AudioVisualizerService,
    CameraRecordingService,
    ScreenshareRecordingService, // Added this line
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
