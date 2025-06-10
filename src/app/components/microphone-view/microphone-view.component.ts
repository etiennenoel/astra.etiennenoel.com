import {
    AfterViewInit,
    AfterViewInit,
    Component,
    Inject,
    OnInit,
    PLATFORM_ID,
    Renderer2
} from '@angular/core';
import {AudioRecordingService} from '../../services/audio-recording.service';
import {AudioVisualizerService} from '../../services/audio-visualizer.service';
import {DOCUMENT, isPlatformBrowser} from "@angular/common";
import {EventStore} from "../../stores/event.store";
import {BaseComponent} from "../base/base.component";
import {PromptManager} from "../../managers/prompt.manager";

@Component({
    selector: 'app-microphone-view',
    standalone: false,
    templateUrl: './microphone-view.component.html',
    styleUrls: ['./microphone-view.component.scss']
})
export class MicrophoneViewComponent extends BaseComponent implements OnInit, AfterViewInit {

    isListening?: boolean = undefined; // Default value, will be overridden by parent

    isProcessing?: boolean = false;

    transcribedText: string = '';
    agentResponseText: string = '';

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) protected override readonly document: Document, // Ensure 'document' is accessible if BaseComponent uses it
        private readonly audioRecordingService: AudioRecordingService,
        private readonly audioVisualizerService: AudioVisualizerService,
        private readonly promptManager: PromptManager,
        private readonly eventStore: EventStore,
        private readonly renderer: Renderer2,
    ) {
        super(document);
    }

    override ngOnInit(): void {
        super.ngOnInit();

        this.subscriptions.push(this.eventStore.isPaused.subscribe(paused => {
            if (paused === undefined) return;

            this.isListening = !paused;

            if (!this.isListening) { // Paused is true
                this.audioRecordingService.stopRecording();
                this.audioVisualizerService.stopVisualization();
            }
            // Start logic is now primarily handled by the startButton click
            // and after processing finishes.
        }));

        this.subscriptions.push(this.eventStore.transcriptionAvailable.subscribe(value => {
            if (!value) {
                this.transcribedText = '';
                return;
            }

            this.transcribedText += value;
        }))

        this.subscriptions.push(this.eventStore.agentResponseAvailable.subscribe(value => {
            if (!value) {
                this.agentResponseText = '';
                return;
            }

            this.agentResponseText += value;
        }))

        this.subscriptions.push(this.eventStore.isProcessing.subscribe(value => {
            this.isProcessing = value;

            if (this.isProcessing) {
                this.audioVisualizerService.stopVisualization();
                this.transcribedText = ''; // Clear text when processing starts
                this.agentResponseText = ''; // Clear agent response when processing starts
            } else {
                // Processing has finished, check if we should resume visualization
                if (this.isListening) {
                    const stream = this.audioRecordingService.getStream(); // Assuming getStream() exists
                    if (stream) {
                        this.audioVisualizerService.startVisualization(stream);
                    } else {
                        console.error("Cannot resume visualization: audio stream not available after processing.");
                        // Potentially try to re-acquire stream or guide user
                    }
                }
            }
        }));
    }

    ngAfterViewInit() {
        // BaseComponent does not have ngAfterViewInit, so no super call needed.
        if (isPlatformBrowser(this.platformId)) {
            this.audioVisualizerService.init(); // Prepare canvas and context

            const startButtonElement = this.document.getElementById('startButton') as HTMLButtonElement;
            const permissionOverlayElement = this.document.getElementById('permission-overlay') as HTMLDivElement;

            if (startButtonElement && permissionOverlayElement) {
                this.renderer.listen(startButtonElement, 'click', async () => {
                    try {
                        const stream = await this.audioRecordingService.startRecording();
                        if (stream) {
                            this.audioVisualizerService.startVisualization(stream);
                            this.renderer.setStyle(permissionOverlayElement, 'display', 'none');
                            this.eventStore.isPaused.next(false); // Signal that listening has started
                        } else {
                            console.error('Failed to get audio stream.');
                            if (permissionOverlayElement) {
                                permissionOverlayElement.innerHTML = '<p class="text-red-500">Could not access microphone. Please check permissions and refresh.</p>';
                            }
                        }
                    } catch (err) {
                        console.error('Error starting audio recording or visualization:', err);
                        if (permissionOverlayElement) {
                            permissionOverlayElement.innerHTML = `<p class="text-red-500">Error: ${err instanceof Error ? err.message : 'Unknown error'}. Please check console and permissions, then refresh.</p>`;
                        }
                    }
                });
            } else {
                console.error('Start button or permission overlay not found.');
            }
        }
    }
}
