import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';

const loginRoutes: Routes = [
    {
        path: 'dashboard',
        component: DashboardComponent,
    },
];

@NgModule({
    imports: [RouterModule.forChild(loginRoutes)],
    exports: [RouterModule],
    providers: [],
})
export class AnalyticsRoutingModule {}
