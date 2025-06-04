import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatCallInterfaceComponent } from './chat-call-interface.component';

describe('ChatCallInterfaceComponent', () => {
  let component: ChatCallInterfaceComponent;
  let fixture: ComponentFixture<ChatCallInterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatCallInterfaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatCallInterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
