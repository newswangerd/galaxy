import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TopSearchQueriesComponent } from './top-search-queries.component';

describe('TopSearchQueriesComponent', () => {
  let component: TopSearchQueriesComponent;
  let fixture: ComponentFixture<TopSearchQueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TopSearchQueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopSearchQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
