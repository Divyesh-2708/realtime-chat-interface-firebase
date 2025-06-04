import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginCompComponent } from './login-comp.component';

describe('LoginCompComponent', () => {
  let component: LoginCompComponent;
  let fixture: ComponentFixture<LoginCompComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginCompComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginCompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
