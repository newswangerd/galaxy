import { Component, Input, OnInit } from '@angular/core';

import { AnalyticsService } from '../../../resources/analytics/analytics.service';

import { CardConfig } from 'patternfly-ng/card/basic-card/card-config';

@Component({
    selector: 'app-position-in-search',
    templateUrl: './position-in-search.component.html',
    styleUrls: ['./position-in-search.component.less'],
})
export class PositionInSearchComponent implements OnInit {
    // Used to track which component is being loaded
    componentName = 'PositionInSearchComponent';

    constructor(private analyticsService: AnalyticsService) {}

    @Input()
    contentName: string;

    data: any;
    selected: {};

    widgetCard: CardConfig;

    ngOnInit() {
        this.selected = [];
        this.widgetCard = {
            title: 'Search Clicks by Rank',
        } as CardConfig;

        const params = {
            widget_name: 'position_in_search',
            content: this.contentName,
        };
        this.analyticsService.query(params).subscribe(result => {
            this.data = result;
            this.selected = this.data.values[0];
        });
    }

    mouseOverSlice($event) {
        this.selected = $event;
    }
}
