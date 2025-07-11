import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import {RootComponent} from './components/root/root.component';
import { LivePage } from './pages/live/live.page';
import {LayoutComponent} from './components/layout/layout.component';
import { CameraViewComponent } from './components/camera-view/camera-view.component';
import { CaptionsViewComponent } from './components/captions-view/captions-view.component';
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
import {EventStore} from './stores/event.store';
import {ToastStore} from './stores/toast.store';
import {ToastComponent} from './components/toast/toast.component';
import { HomePage } from './pages/home/home.page';
import {ConversationHistoryManager} from './managers/conversation-history.manager';
import { AudioParametersFormComponent } from './components/audio-parameters-form/audio-parameters-form.component';
import {AudioProcessor} from './processors/audio.processor';
import {DetectionParametersProvider} from './providers/detection-parameters.provider';
import {SpeechSynthesisService} from './services/speech-synthesis.service';

@NgModule({
  declarations: [
    LayoutComponent,
    RootComponent,

    ActionButtonComponent,
    FooterComponent,
    LivePage,
    CameraViewComponent,
    CaptionsViewComponent,
    MicrophoneVisualizerComponent,
    ScreenshareViewComponent,
    ToastComponent,
    HomePage,
    AudioParametersFormComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    // Added this line
  ],
  providers: [
    provideClientHydration(withEventReplay()),

    // Managers
    ContextManager,
    ConversationHistoryManager,
    PromptManager,

    // Processors
    AudioProcessor,

    // Services
    AudioRecordingService,
    AudioVisualizerService,
    CameraRecordingService,
    ScreenshareRecordingService, // Added this line
    SpeechSynthesisService,

    // Stores
    EventStore,
    ToastStore,

    DetectionParametersProvider,
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
