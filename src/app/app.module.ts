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
import {FooterComponent} from './components/footer/footer.component';
import {ActionButtonComponent} from './components/action-button/action-button.component';
import {ContextManager} from './managers/context.manager';

@NgModule({
  declarations: [
    LayoutComponent,
    RootComponent,

    ActionButtonComponent,
    FooterComponent,
    HomeComponent,
    CameraViewComponent,
    MicrophoneViewComponent
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
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
