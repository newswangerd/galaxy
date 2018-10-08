import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    // Used to track which component is being loaded
    componentName = 'DashboardComponent';

    constructor(private route: ActivatedRoute) {}

    range = '1w';
    contentName: string;
    pageTitle: string;

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            if ('range' in params) {
                this.range = params['range'];
            }
            if ('content' in params) {
                this.contentName = params['content'];
            }
            this.pageTitle = 'Dashboard: ' + this.contentName;
        });
    }
}
