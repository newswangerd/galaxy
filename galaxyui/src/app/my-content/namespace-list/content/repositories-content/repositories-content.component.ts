import {
    Component,
    Input,
    Output,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    EventEmitter,
} from '@angular/core';

import { ActionConfig } from 'patternfly-ng/action/action-config';
import { EmptyStateConfig } from 'patternfly-ng/empty-state/empty-state-config';
import { ListConfig } from 'patternfly-ng/list/basic-list/list-config';

import { BsModalRef, BsModalService } from 'ngx-bootstrap';

import { FilterConfig } from 'patternfly-ng/filter/filter-config';
import { FilterField } from 'patternfly-ng/filter/filter-field';
import { FilterType } from 'patternfly-ng/filter/filter-type';

import { SortConfig } from 'patternfly-ng/sort/sort-config';
import { SortField } from 'patternfly-ng/sort/sort-field';
import { SortEvent } from 'patternfly-ng/sort/sort-event';

import { PaginationConfig } from 'patternfly-ng/pagination/pagination-config';
import { PaginationEvent } from 'patternfly-ng/pagination/pagination-event';
import { ToolbarConfig } from 'patternfly-ng/toolbar/toolbar-config';

import { Namespace } from '../../../../resources/namespaces/namespace';
import { PagedResponse } from '../../../../resources/paged-response';
import { ProviderNamespace } from '../../../../resources/provider-namespaces/provider-namespace';
import { Repository as VanillaRepo } from '../../../../resources/repositories/repository';
import { RepositoryService } from '../../../../resources/repositories/repository.service';
import { RepositoryImportService } from '../../../../resources/repository-imports/repository-import.service';
import { CollectionListService } from '../../../../resources/collections/collection.service';
import { CollectionList } from '../../../../resources/collections/collection';

import { AlternateNameModalComponent } from './alternate-name-modal/alternate-name-modal.component';

import { interval } from 'rxjs';

import * as moment from 'moment';

class Repository extends VanillaRepo {
    expanded: boolean;
    loading: boolean;
}

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'repositories-content',
    templateUrl: './repositories-content.component.html',
    styleUrls: ['./repositories-content.component.less'],
})
export class RepositoriesContentComponent implements OnInit, OnDestroy {
    // Used to track which component is being loaded
    componentName = 'RepositoriesContentComponent';

    @Output()
    uploadCollection = new EventEmitter<any>();

    @Input()
    namespace: Namespace;

    @Input()
    set contentAdded(state: number) {
        // Get signal from parent when content added
        if (state !== this._contentAdded) {
            this._contentAdded = state;
            console.log('Refreshing repositories');
            this.refreshContent();
        }
    }

    get contentChanged(): number {
        return this._contentAdded;
    }

    private _contentAdded: number;
    items: any = {
        repositories: [] as Repository[],
        collections: [] as CollectionList[],
    };

    emptyStateConfig: EmptyStateConfig;
    nonEmptyStateConfig: EmptyStateConfig;
    disabledStateConfig: EmptyStateConfig;
    paginationConfig: PaginationConfig = {
        pageSize: 10,
        pageNumber: 1,
        totalItems: 0,
    };
    maxItems = 0;

    listConfig: ListConfig;
    selectType = 'checkbox';
    loading = false;
    polling = null;
    pollingEnabled = true;
    bsModalRef: BsModalRef;

    filterConfig: FilterConfig;
    sortConfig: SortConfig;
    currentSortField: SortField;
    sortBy = 'name';
    toolbarConfig: ToolbarConfig;
    isAscendingSort = true;
    contentType = 'repositories';

    constructor(
        private repositoryService: RepositoryService,
        private repositoryImportService: RepositoryImportService,
        private modalService: BsModalService,
        private collectionService: CollectionListService,
    ) {
        this.modalService.onHidden.subscribe(_ => {
            if (this.bsModalRef && this.bsModalRef.content.startedImport) {
                // Import started by AlternateNamedModalComponent
                console.log('Refreshing content...');
                this.refreshContent();
            }
        });
    }

    ngOnInit(): void {
        const provider_namespaces = this.namespace.summary_fields
            .provider_namespaces;

        this.filterConfig = {
            fields: [
                {
                    id: 'name',
                    title: 'Name',
                    placeholder: 'Filter by Name...',
                    type: FilterType.TEXT,
                },
            ] as FilterField[],
            resultsCount: this.items.repositories.length,
            appliedFilters: [],
        } as FilterConfig;

        this.sortConfig = {
            fields: [
                {
                    id: 'name',
                    title: 'Name',
                    sortType: 'alpha',
                },
                {
                    id: 'modified',
                    title: 'Last Modified',
                    sortType: 'alpha',
                },
            ],
            isAscending: this.isAscendingSort,
        } as SortConfig;

        this.toolbarConfig = {
            filterConfig: this.filterConfig,
            sortConfig: this.sortConfig,
            views: [],
        } as ToolbarConfig;

        this.emptyStateConfig = {
            actions: {
                primaryActions: [],
                moreActions: [],
            } as ActionConfig,
            iconStyleClass: 'pficon-warning-triangle-o',
            title: 'No Repositories',
            info:
                'Add repositories by clicking the "Add Content" button above.',
            helpLink: {},
        } as EmptyStateConfig;

        this.nonEmptyStateConfig = {
            actions: {
                primaryActions: [],
                moreActions: [],
            } as ActionConfig,
            iconStyleClass: '',
            title: '',
            info: '',
            helpLink: {},
        } as EmptyStateConfig;

        this.disabledStateConfig = {
            iconStyleClass: 'pficon-warning-triangle-o',
            info: `The Namespace ${
                this.namespace.name
            } is disabled. You'll need to re-enable it before viewing and modifying its content.`,
            title: 'Namespace Disabled',
        } as EmptyStateConfig;

        this.listConfig = {
            dblClick: false,
            emptyStateConfig: this.nonEmptyStateConfig,
            multiSelect: false,
            selectItems: false,
            selectionMatchProp: 'name',
            showCheckbox: false,
            useExpandItems: true,
        } as ListConfig;

        if (this.namespace.active && provider_namespaces.length) {
            this.getRepositories();
        }
    }

    ngOnDestroy(): void {
        if (this.polling) {
            this.polling.unsubscribe();
        }
    }

    // Actions

    // UPDATE
    handleItemAction($event): void {
        const item = $event['item'];
        if (item) {
            switch ($event['id']) {
                case 'import':
                    this.importRepository(item);
                    break;
                case 'delete':
                    this.deleteRepository(item);
                    break;
                case 'changeName':
                    this.changeRepositoryName(item);
                    break;
                case 'deprecate':
                    this.deprecate(true, item);
                    break;
                case 'undeprecate':
                    this.deprecate(false, item);
                    break;
                case 'new-version':
                    this.uploadCollection.emit(item);
            }
        }
    }

    handlePageChange($event: PaginationEvent): void {
        if ($event.pageSize || $event.pageNumber) {
            this.loading = true;
            this.refreshContent();
        }
    }

    filterChanged($event): void {
        this.paginationConfig.pageNumber = 1;
        this.loading = true;
        this.refreshContent();
    }

    sortChanged($event: SortEvent): void {
        if ($event.isAscending) {
            this.sortBy = $event.field.id;
        } else {
            this.sortBy = '-' + $event.field.id;
        }
        this.refreshContent();
    }

    toggleItem(item) {
        item.expanded = !item.expanded;
    }

    setTypeDisplayed(type: string) {
        this.contentType = type;
        this.refreshContent();
    }

    // Private

    private deprecate(isDeprecated: boolean, repo: Repository): void {
        repo.loading = true;

        // Force angular change detection to fire by creating a new object with a
        // new reference.
        repo = JSON.parse(JSON.stringify(repo));
        repo.deprecated = isDeprecated;

        this.repositoryService.save(repo).subscribe(response => {
            const itemIndex = this.items.repositories.findIndex(
                el => el.id === repo.id,
            );
            if (typeof response !== 'undefined') {
                repo.loading = false;
                repo.deprecated = response.deprecated;
                this.items.repositories[itemIndex] = repo;
            } else {
                this.items.repositories[itemIndex].loading = false;
            }
        });
    }

    private pollRepos() {
        if (this.pollingEnabled) {
            this.refreshContent();
        }
    }

    private getRepositories() {
        this.loading = true;
        this.polling = interval(10000).subscribe(pollingResult => {
            this.pollRepos();
        });
    }

    private getDetailUrl(item) {
        return `/${this.namespace.name}/${item.name}`;
    }

    private getIconClass(repository_format: string) {
        let result = 'pficon-repository list-pf-icon list-pf-icon-small';
        switch (repository_format) {
            case 'apb':
                result = 'pficon-bundle list-pf-icon list-pf-icon-small';
                break;
            case 'role':
                result = 'fa fa-gear list-pf-icon list-pf-icon-small';
                break;
        }
        return result;
    }

    private prepareItem(item) {
        item['expanded'] = false;
        item['latest_import'] = {};
        item['detail_url'] = this.getDetailUrl(item);
        item['iconClass'] = this.getIconClass(item.format);
        if (item.summary_fields.latest_import) {
            item['latest_import'] = item.summary_fields.latest_import;
            if (item['latest_import']['finished']) {
                item['latest_import']['as_of_dt'] = moment(
                    item['latest_import']['finished'],
                ).fromNow();
            } else {
                item['latest_import']['as_of_dt'] = moment(
                    item['latest_import']['modified'],
                ).fromNow();
            }
        }
    }

    private refreshContent() {
        let query = {
            page_size: this.paginationConfig.pageSize,
            page: this.paginationConfig.pageNumber,
        };

        query = this.addQueryFilters(query);

        switch (this.contentType) {
            case 'repositories':
                this.refreshRepositories(query);
                break;
            case 'collections':
                this.refreshCollections(query);
                break;
        }
    }

    private addQueryFilters(query) {
        if (this.filterConfig) {
            for (const filter of this.filterConfig.appliedFilters) {
                query[`or__${filter.field.id}__icontains`] = filter.value;
            }
        }
        if (this.sortConfig) {
            query['order_by'] = this.sortBy;
        }

        return query;
    }

    private refreshCollections(query) {
        query['namespace'] = this.namespace.id;

        this.collectionService
            .pagedQuery(query)
            .subscribe((result: PagedResponse) => {
                console.log(result);
                this.handleQueryResults(result);
            });
    }

    private refreshRepositories(query) {
        // Django REST framework allows us to query multiple namespaces by using
        // provider_namespace__id__in=id1,id2,id3

        query['provider_namespace__id__in'] = '';

        this.namespace.summary_fields.provider_namespaces.forEach(
            (pns: ProviderNamespace) => {
                query['provider_namespace__id__in'] += pns.id + ',';
            },
        );

        query['provider_namespace__id__in'] = query[
            'provider_namespace__id__in'
        ].slice(0, -1);

        this.repositoryService
            .pagedQuery(query)
            .subscribe((result: PagedResponse) => {
                this.handleQueryResults(result);
            });
    }

    private handleQueryResults(result: PagedResponse) {
        const items = result.results;

        this.filterConfig.resultsCount = result.count;
        this.paginationConfig.totalItems = result.count;

        // maxItems is used to determine if we need to show the filter or not
        // it should never go down to avoid hiding the filter by accident when
        // a query returns a small number of items.
        if (this.maxItems < this.paginationConfig.totalItems) {
            this.maxItems = this.paginationConfig.totalItems;
        }

        // Collect a list of expanded items to keep them from getting
        // closed when the page refreshes.
        const expanded = [];

        this.items[this.contentType].forEach(item => {
            if (item.expanded) {
                expanded.push(item.id);
            }
        });

        // Generate a new list of repos
        const updatedList = [];

        // Only poll imports if there are pending imports
        this.pollingEnabled = false;
        items.forEach(item => {
            if (
                item['summary_fields'].latest_import.state === 'PENDING' ||
                item['summary_fields'].latest_import.state === 'RUNNING'
            ) {
                this.pollingEnabled = true;
            }

            this.prepareItem(item);
            if (expanded.includes(item['id'])) {
                item.expanded = true;
            }
            updatedList.push(item);
        });

        // set the old list to the new list to avoid screen flickering
        this.items[this.contentType] = updatedList;
        this.loading = false;

        // Show blank screen during loads.
        this.updateEmptyState();
    }

    private updateEmptyState(): void {
        if (this.items.repositories.length === 0) {
            this.listConfig.emptyStateConfig = this.emptyStateConfig;
        } else {
            this.listConfig.emptyStateConfig = this.nonEmptyStateConfig;
        }
    }

    private importRepository(repository: Repository) {
        // Start an import
        this.pollingEnabled = true;
        repository['latest_import']['state'] = 'PENDING';
        repository['latest_import']['as_of_dt'] = '';
        this.repositoryImportService
            .save({ repository_id: repository.id })
            .subscribe(response => {
                console.log(`Started import for repository ${repository.id}`);
            });
    }

    private deleteRepository(repository: Repository) {
        this.loading = true;
        this.repositoryService.destroy(repository).subscribe(_ => {
            this.items.repositories.forEach((item: Repository, idx: number) => {
                if (item.id === repository.id) {
                    this.items.repositories.splice(idx, 1);
                    this.loading = false;
                    this.updateEmptyState();
                }
            });
        });
    }

    private changeRepositoryName(repository: Repository) {
        const initialState = {
            repository: repository,
        };
        this.bsModalRef = this.modalService.show(AlternateNameModalComponent, {
            initialState: initialState,
            keyboard: true,
            animated: true,
        });
    }
}
