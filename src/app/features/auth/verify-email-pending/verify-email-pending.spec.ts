import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyEmailPending } from './verify-email-pending';

describe('VerifyEmailPending', () => {
  let component: VerifyEmailPending;
  let fixture: ComponentFixture<VerifyEmailPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailPending);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
