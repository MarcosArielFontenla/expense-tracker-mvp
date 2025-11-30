import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyEmailSuccess } from './verify-email-success';

describe('VerifyEmailSuccess', () => {
  let component: VerifyEmailSuccess;
  let fixture: ComponentFixture<VerifyEmailSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyEmailSuccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
