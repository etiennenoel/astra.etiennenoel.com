import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PromptManager {

  // @ts-expect-error
  private languageModel!: LanguageModel;

  constructor() {
    // @ts-expect-error
    LanguageModel.create({}).then((languageModel: LanguageModel) => {
      this.languageModel = languageModel;
    });
  }

  promptStreaming(prompt: string) {

  }

  transcribe(){}

  describeImage() {}
}
