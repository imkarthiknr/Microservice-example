import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetDeleteComponent } from './get-delete.component';

describe('GetDeleteComponent', () => {
  let component: GetDeleteComponent;
  let fixture: ComponentFixture<GetDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GetDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
