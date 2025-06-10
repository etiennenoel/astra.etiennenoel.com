import {Directive, OnDestroy, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {BaseComponent} from './base.component';

@Directive()
export abstract class BasePageComponent extends BaseComponent implements OnInit, OnDestroy {
  constructor(
    document: Document,
    protected readonly titleService: Title,
    ) {
    super(document);
  }

  setTitle(title: string) {
    this.titleService.setTitle(title + " | money.etiennenoel.com");
  }
}
