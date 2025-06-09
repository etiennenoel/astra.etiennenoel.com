import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PromptManager {

  private languageModel!: LanguageModel;

  constructor() {
    LanguageModel.create({}).then(languageModel => {
      this.languageModel = languageModel;
    });
  }

  promptStreaming(prompt: string) {

  }

  transcribe(){}

  describeImage() {}
}
