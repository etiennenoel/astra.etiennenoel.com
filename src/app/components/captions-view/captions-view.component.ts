import {
    AfterViewInit,
    Component,
    ElementRef, Inject,
    Input,
    OnChanges, OnInit,
    PLATFORM_ID,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {AudioRecordingService} from '../../services/audio-recording.service';
import {AudioVisualizerService} from '../../services/audio-visualizer.service';
import {DOCUMENT, isPlatformBrowser, isPlatformServer} from "@angular/common";
import {EventStore} from "../../stores/event.store";
import {BaseComponent} from "../base/base.component";
import {PromptManager} from "../../managers/prompt.manager";

@Component({
    selector: 'app-captions-view',
    standalone: false,
    templateUrl: './captions-view.component.html',
    styleUrls: ['./captions-view.component.scss']
})
export class CaptionsViewComponent extends BaseComponent implements OnInit, AfterViewInit {

    isListening?: boolean = undefined; // Default value, will be overridden by parent

    isProcessing?: boolean = false;

    @ViewChild("canvasElement")
    public canvasElement?: ElementRef;

    stream?: MediaStream;

    transcribedText: string = '';
    agentResponseText: string = '';

    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        @Inject(DOCUMENT) document: Document,
        private readonly audioRecordingService: AudioRecordingService,
        private readonly audioVisualizerService: AudioVisualizerService,
        private readonly promptManager: PromptManager,
        private readonly eventStore: EventStore,
    ) {
        super(document);
    }

    override ngOnInit(): void {
        super.ngOnInit();

        this.subscriptions.push(this.eventStore.isPaused.subscribe(value => {
            if (value === undefined) {
                return;
            }
            this.isListening = !value;
        }))

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
            if (value === true) {
                this.isProcessing = true;
                this.transcribedText = '';
                this.agentResponseText = '';
                return;
            }

            this.isProcessing = false;
        }));
    }

    ngAfterViewInit() {
        if (isPlatformBrowser(this.platformId) && this.canvasElement) {
            this.audioVisualizerService.init(this.canvasElement)
        }
    }
}
