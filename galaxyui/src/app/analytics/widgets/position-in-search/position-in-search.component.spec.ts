import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PositionInSearchComponent } from './position-in-search.component';

describe('PositionInSearchComponent', () => {
  let component: PositionInSearchComponent;
  let fixture: ComponentFixture<PositionInSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PositionInSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PositionInSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
