import {Inject} from '@angular/core';
import {ToastMessageInterface} from '../interfaces/toast-message.interface';
import {BehaviorSubject, Subject} from 'rxjs';

@Inject({
  providedIn: 'root'
})
export class ToastStore {
  messages = new Subject<ToastMessageInterface>();

  subscribe = this.messages.subscribe;

  publish(message: ToastMessageInterface) {
    if(!message.position) {
      message.position = 'bottom';
    }
    this.messages.next(message);
  }
}
