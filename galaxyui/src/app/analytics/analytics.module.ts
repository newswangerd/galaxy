import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PositionInSearchComponent } from './widgets/position-in-search/position-in-search.component';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { DashboardComponent } from './dashboard/dashboard.component';

import { CardModule } from 'patternfly-ng/card/basic-card/card.module';

import { AnalyticsRoutingModule } from './analytics.routing.module';

@NgModule({
    imports: [CardModule, CommonModule, NgxChartsModule, AnalyticsRoutingModule],
    declarations: [PositionInSearchComponent, DashboardComponent],
    exports: [PositionInSearchComponent, DashboardComponent],
})
export class AnalyticsModule {}
