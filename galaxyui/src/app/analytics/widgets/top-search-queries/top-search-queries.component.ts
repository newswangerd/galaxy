import { Component, Input, OnInit } from '@angular/core';

import { AnalyticsService } from '../../../resources/analytics/analytics.service';

import { CardConfig } from 'patternfly-ng/card/basic-card/card-config';

@Component({
    selector: 'app-top-search-queries',
    templateUrl: './top-search-queries.component.html',
    styleUrls: ['./top-search-queries.component.less'],
})
export class TopSearchQueriesComponent implements OnInit {
    // Used to track which component is being loaded
    componentName = 'TopSearchQueriesComponent';

    constructor(private analyticsService: AnalyticsService) {}

    @Input()
    contentName: string;

    @Input()
    range: string;

    data: any;

    widgetCard: CardConfig;

    ngOnInit() {
        this.widgetCard = {
            title: 'Top Search Queries',
        } as CardConfig;

        const params = {
            widget_name: 'top_keywords',
            content: this.contentName,
            range: this.range,
        };
        this.analyticsService.query(params).subscribe(result => {
            this.data = result;
        });
    }
}
