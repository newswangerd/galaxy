import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
    // Used to track which component is being loaded
    componentName = 'DashboardComponent';

    constructor() {}

    ngOnInit() {}
}
