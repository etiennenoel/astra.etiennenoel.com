import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivePage } from './live.page';

describe('LivePage', () => {
  let component: LivePage;
  let fixture: ComponentFixture<LivePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LivePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
