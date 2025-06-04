import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomingCallDialogComponent } from './incoming-call-dialog.component';

describe('IncomingCallDialogComponent', () => {
  let component: IncomingCallDialogComponent;
  let fixture: ComponentFixture<IncomingCallDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomingCallDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomingCallDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
