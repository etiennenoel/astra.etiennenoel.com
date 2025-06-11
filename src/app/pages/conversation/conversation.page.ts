import { Component, Inject } from '@angular/core'; // Added Inject here
import { BaseComponent } from '../../components/base/base.component';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-conversation',
  standalone: false,
  templateUrl: './conversation.page.html',
  styleUrls: ['./conversation.page.scss']
})
export class ConversationPage extends BaseComponent {
  constructor(@Inject(DOCUMENT) document: Document) {
    super(document);
  }
}
