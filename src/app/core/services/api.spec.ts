import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { PatientsApi } from './patients-api.service';

describe('PatientsApi', () => {
  let service: PatientsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(PatientsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
