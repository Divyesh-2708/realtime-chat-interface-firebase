import { TestBed } from '@angular/core/testing';

import { CallListenerService } from './call-listener.service';

describe('CallListenerService', () => {
  let service: CallListenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CallListenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
