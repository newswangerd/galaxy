import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PositionInSearchComponent } from './widgets/position-in-search/position-in-search.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardComponent } from './dashboard/dashboard.component';

import { CardModule } from 'patternfly-ng/card/basic-card/card.module';

import { SharedModule } from '../shared/shared.module';

import { AnalyticsRoutingModule } from './analytics.routing.module';
import { TopSearchQueriesComponent } from './widgets/top-search-queries/top-search-queries.component';

@NgModule({
    imports: [CardModule, CommonModule, NgxChartsModule, AnalyticsRoutingModule, SharedModule],
    declarations: [PositionInSearchComponent, DashboardComponent, TopSearchQueriesComponent],
    exports: [PositionInSearchComponent, TopSearchQueriesComponent],
})
export class AnalyticsModule {}
