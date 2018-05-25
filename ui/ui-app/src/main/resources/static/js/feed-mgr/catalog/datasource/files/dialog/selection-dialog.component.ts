import {Component, Inject, OnInit} from '@angular/core';
import {ITdDataTableColumn, ITdDataTableSortChangeEvent, TdDataTableService, TdDataTableSortingOrder} from '@covalent/core/data-table';
import {IPageChangeEvent} from '@covalent/core/paging';
import {SelectionService} from '../../../api/services/selection.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Node} from '../node';

export class SelectedItem {
    node: Node;
    path: string;
    constructor(path: string, node: Node) {
        this.node = node;
        this.path = path;
    }
}


@Component({
    selector: 'selection-dialog',
    styleUrls: ['js/feed-mgr/catalog/datasource/files/dialog/selection-dialog.component.css'],
    templateUrl: 'js/feed-mgr/catalog/datasource/files/dialog/selection-dialog.component.html',
})
export class SelectionDialogComponent implements OnInit {

    sortBy = 'path';
    sortOrder: TdDataTableSortingOrder = TdDataTableSortingOrder.Ascending;
    searchTerm: string = '';
    filteredFiles: SelectedItem[] = [];
    filteredTotal = 0;
    fromRow: number = 1;
    currentPage: number = 1;
    pageSize: number = 10;
    columns: ITdDataTableColumn[] = [
        {name: "path", label: "Path", sortable: false},
        {name: "remove", label: "", sortable: false, width: 50},
    ];
    datasourceId: string;
    selected: SelectedItem[] = [];
    initialItemCount: number = 0;


    constructor(private selfReference: MatDialogRef<SelectionDialogComponent>, private dataTableService: TdDataTableService,
                private selectionService: SelectionService, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.datasourceId = data.datasourceId;
    }

    public ngOnInit(): void {
        console.log('on init');
        const root: Node = this.selectionService.get(this.datasourceId);
        this.addSelectedChildren(root);
        this.initialItemCount = this.selected.length;
        this.filter();
    }

    addSelectedChildren(node: Node) {
        const children = node.getSelectedChildren();
        for (let child of children) {
            this.selected.push(new SelectedItem(child.getPath(), child));
            this.addSelectedChildren(child);
        }
    }


    onOk() {
        // if (this.isSelectionUpdated()) {
        //     const selectionService = this.selectionService;
        //     const datasourceId = this.datasourceId;
        //     this.selectionService.reset(this.datasourceId);
        //     const groupedByLocation = _.groupBy(this.selected, 'location');
        //     _.forEach(groupedByLocation, function(group: SelectedItem[], location: string) {
        //         const selectedItems: Map<string, boolean> = new Map<string, boolean>();
        //         for (let item of group) {
        //             selectedItems.set(item.file, true);
        //         }
        //         selectionService.set(datasourceId, location, selectedItems);
        //     });
        //     this.selfReference.close(true);
        // } else {
        //     this.selfReference.close(false);
        // }
    }

    private isSelectionUpdated() {
        return this.initialItemCount !== this.selected.length;
    }

    removeItem(toBeRemoved: SelectedItem) {
        this.selected = this.selected.filter(item => item !== toBeRemoved);
        this.filter();
    }

    sort(sortEvent: ITdDataTableSortChangeEvent): void {
        this.sortBy = sortEvent.name;
        this.sortOrder = sortEvent.order === TdDataTableSortingOrder.Descending ? TdDataTableSortingOrder.Ascending : TdDataTableSortingOrder.Descending;
        this.filter();
    }

    search(searchTerm: string): void {
        this.searchTerm = searchTerm;
        this.filter();
    }

    page(pagingEvent: IPageChangeEvent): void {
        this.fromRow = pagingEvent.fromRow;
        this.currentPage = pagingEvent.page;
        this.pageSize = pagingEvent.pageSize;
        setTimeout(() => {
            //async because otherwise ExpressionChangedAfterItHasBeenCheckedError
            // occurs when changing page size
            this.filter();
        });
    }

    private filter(): void {
        let newData: any[] = this.selected;
        let excludedColumns: string[] = this.columns
            .filter((column: ITdDataTableColumn) => {
                return ((column.filter === undefined && column.hidden === true) ||
                    (column.filter !== undefined && column.filter === false));
            }).map((column: ITdDataTableColumn) => {
                return column.name;
            });
        newData = this.dataTableService.filterData(newData, this.searchTerm, true, excludedColumns);
        this.filteredTotal = newData.length;
        newData = this.dataTableService.sortData(newData, this.sortBy, this.sortOrder);
        newData = this.dataTableService.pageData(newData, this.fromRow, this.currentPage * this.pageSize);
        this.filteredFiles = newData;
    }

}
