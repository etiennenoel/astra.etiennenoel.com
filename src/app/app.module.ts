import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Added this line

import { AppRoutingModule } from './app-routing.module';
import {RootComponent} from './components/root/root.component';
import { HomeComponent } from './pages/home/home.component';
import {LayoutComponent} from './components/layout/layout.component';
import { CameraViewComponent } from './components/camera-view/camera-view.component';
import { MicrophoneComponent } from './components/microphone/microphone.component';
import {PromptManager} from './managers/prompt.manager';
import {AudioRecordingService} from './services/audio-recording.service';
import {AudioVisualizerService} from './services/audio-visualizer.service';

@NgModule({
  declarations: [
    LayoutComponent,
    RootComponent,


    HomeComponent,
    CameraViewComponent,
    MicrophoneComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule // Added this line
  ],
  providers: [
    provideClientHydration(withEventReplay()),

    // Managers
    PromptManager,

    // Services
    AudioRecordingService,
    AudioVisualizerService,
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
