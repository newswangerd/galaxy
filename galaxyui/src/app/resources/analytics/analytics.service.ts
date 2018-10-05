import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { NotificationService } from 'patternfly-ng/notification/notification-service/notification.service';

import { GenericQuery } from '../base/generic-query';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class AnalyticsService extends GenericQuery<any> {
    constructor(http: HttpClient, notificationService: NotificationService) {
        super(http, notificationService, '/api/v1/analytics', 'analytics');
    }

    query(params?: any): Observable<any> {
        return this.http.get<any>(this.url + '/', { params: params }).pipe(
            tap(_ => this.log(`fetched ${this.serviceName}`)),
            catchError(this.handleError('Query', [] as any[])),
        );
    }
}
