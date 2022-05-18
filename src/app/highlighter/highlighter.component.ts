import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  GRID_ITEMS_HEADER_HEIGHT,
  NAV_ITEM_HEIGHT,
  ROW_TEXT_HEIGHT,
  SIDEBAR_WIDTH,
  TOOLBAR_HEIGHT,
} from '../enums/constants';
import { Column, GridJsonData, Rect, Row } from '../enums/grid-coords';
import { GridService } from '../services/grid.service';
import { PointerService } from '../services/pointer.service';
import { UtilityService } from '../services/utility.service';
import GridData from '../../assets/grid.json';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-highlighter',
  templateUrl: './highlighter.component.html',
  styleUrls: ['./highlighter.component.scss'],
})
export class HighlighterComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() data: any = [];
  @ViewChild('fileImage') fileImage: ElementRef;
  @Output() updateSidebarItems: EventEmitter<any> = new EventEmitter<any>();
  @Input() gridData: any;
  @Input() isEditGrid: boolean;
  @Input() isSelectionBox: boolean;
  @Input() images: any[];
  @Input() currentImage: string = '';
  currentEditingPoint: any;
  initialData: any = [];
  gridJson: GridJsonData[] = JSON.parse(JSON.stringify(GridData));
  gridCoords: Rect = this.mapGridCoords(this.gridJson);
  gridCols: Record<string, Column>[] = [];
  gridRows: Row[] = [];
  aspectRatio: number;
  activeIndex: number;
  activeSidebarIndex: number;
  activeRowIndex: number;
  activeKey: string;
  navItemsHeight: any = NAV_ITEM_HEIGHT;
  toolbarHeight: number = TOOLBAR_HEIGHT;
  gridItemsHeaderHeight: number = GRID_ITEMS_HEADER_HEIGHT;
  rowTextHeight: number = ROW_TEXT_HEIGHT;
  sidebarWidth: number = SIDEBAR_WIDTH;
  subs: Subscription[] = [];
  constructor(
    private pointer: PointerService,
    private utility: UtilityService,
    private api: ApiService,
    private grid: GridService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isEditGrid) {
      this.grid.initAndResizeCanvas(
        this.gridCoords,
        this.gridCols,
        this.gridRows
      );
      this.updateCoordinates();
    } else if (this.isSelectionBox) {
      this.grid.selectByHighlight();
      this.resetCanvasLine();
      this.activeIndex = -1;
      this.deCollapseItems();
      this.updateCoordinates();
    } else {
      if (
        !changes['isEditGrid']?.firstChange ||
        !changes['isSelectionBox']?.firstChange
      ) {
        this.resetCoordinates();
      }
    }
  }

  ngOnInit(): void {
    this.gridCols = this.mapGridCols(this.gridJson);
    this.gridRows = this.mapGridRows(this.gridJson);
    this.initialData = JSON.parse(JSON.stringify(this.data));
    this.subs.push(
      this.pointer.$gridCoords.subscribe((rect: Rect) => {
        if (rect) this.gridCoords = rect;
      })
    );
    this.subs.push(
      this.pointer.$gridCols.subscribe((cols: Record<string, Column>[]) => {
        this.gridCols = cols;
      })
    );
    this.subs.push(
      this.pointer.$gridRows.subscribe((rows: Row[]) => {
        this.gridRows = rows;
      })
    );
    this.subs.push(
      this.pointer.$itemPointEmitter.subscribe((key: string) => {
        this.deCollapseItems();
        if (key !== null) {
          this.activeIndex = this.data.findIndex((item) => item.key === key);
          this.activeKey =
            this.pointer.sidebarItems[this.pointer.navItemIndex][0];
          this.setCanvasLine(this.activeIndex);
          this.collapseItem(this.activeIndex);
        } else {
          this.resetCanvasLine();
          this.activeIndex = -1;
          this.deCollapseItems();
        }
      })
    );
    this.subs.push(
      this.pointer.$gridItemPointEmitter.subscribe(
        (info: { key: string; rowIndex: number }) => {
          this.activeRowIndex = info.rowIndex;
          if (info.key !== null) {
            this.activeIndex = this.data.findIndex(
              (item) => item.key === info.key
            );
            this.activeSidebarIndex = this.gridData[
              this.activeRowIndex
            ][1].findIndex((col) => {
              return col[1].key === info.key;
            });
            this.activeKey =
              this.pointer.gridItems[this.activeRowIndex][1][
                this.pointer.gridItemIndex
              ][0];
            this.setGridCanvasLine(this.activeIndex);
            // this.setOverallColBox(this.activeSidebarIndex);
          }
        }
      )
    );
    this.subs.push(
      this.pointer.$selectedBox.subscribe((rect) => {
        if (rect) {
          const formData = new FormData();
          formData.append('top', rect.top);
          formData.append('left', rect.left);
          formData.append('height', rect.height);
          formData.append('width', rect.width);
          formData.append('page_index', rect.page_index);
          formData.append('allocr', JSON.stringify(this.api.allPoints));
          this.api
            .getSelectedPoint(formData)
            .pipe(take(1))
            .subscribe((text) => {
              if (isNaN(this.pointer.navItemIndex)) {
                const point =
                  this.pointer.gridItems[this.pointer.currentRowIndex][1][
                    this.pointer.gridItemIndex
                  ];
                if (point) {
                  this.pointer.gridItems[this.pointer.currentRowIndex][1][
                    this.pointer.gridItemIndex
                  ] = [
                    point[0],
                    {
                      ...point[1],
                      key: text,
                      word: text,
                      width: `${+rect.width * this.utility.aspectRatio}px`,
                      height: `${+rect.height * this.utility.aspectRatio}px`,
                      top: `${+rect.top * this.utility.aspectRatio}px`,
                      left: `${+rect.left * this.utility.aspectRatio}px`,
                      'page-index': +rect.page_index,
                    },
                  ];
                  this.currentEditingPoint = {
                    ...point[1],
                    key: text,
                    word: text,
                    width: `${+rect.width}px`,
                    height: `${+rect.height}px`,
                    top: `${+rect.top}px`,
                    left: `${+rect.left}px`,
                    modalTop: `${+rect.top + +rect.height}px`,
                    collapsed: false,
                    'page-index': +rect.page_index,
                  };
                }
              } else {
                const point =
                  this.pointer.sidebarItems[this.pointer.navItemIndex];
                this.pointer.sidebarItems[this.pointer.navItemIndex] = [
                  point[0],
                  {
                    ...point[1],
                    key: text,
                    word: text,
                    width: `${+rect.width * this.utility.aspectRatio}px`,
                    height: `${+rect.height * this.utility.aspectRatio}px`,
                    top: `${+rect.top * this.utility.aspectRatio}px`,
                    left: `${+rect.left * this.utility.aspectRatio}px`,
                    'page-index': +rect.page_index,
                  },
                ];
                this.currentEditingPoint = {
                  ...point[1],
                  key: text,
                  word: text,
                  width: `${+rect.width}px`,
                  height: `${+rect.height}px`,
                  top: `${+rect.top}px`,
                  left: `${+rect.left}px`,
                  modalTop: `${+rect.top + +rect.height}px`,
                  collapsed: false,
                  'page-index': +rect.page_index,
                };
              }
            });
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.initializeImage();
  }

  initializeImage(): void {
    if (this.fileImage)
      this.fileImage.nativeElement.src = `data:image/png;base64,${this.currentImage}`;
  }

  ngOnDestroy(): void {
    for (let sub of this.subs) {
      sub.unsubscribe();
    }
  }

  private mapGridCoords(gridJson: GridJsonData[]): Rect {
    const keyValue: [string, any] = Object.entries(gridJson[0])[0];
    return {
      startX: keyValue[1]['top-left-point'][1],
      startY: keyValue[1]['top-left-point'][0],
      w: keyValue[1].width,
      h: keyValue[1].height,
    };
  }

  private mapGridCols(gridJson: GridJsonData[]): Record<string, Column>[] {
    const keyValue: [string, any] = Object.entries(gridJson[1])[0];
    return keyValue[1];
  }
  private mapGridRows(gridJson: GridJsonData[]): Row[] {
    const keyValue: [string, any] = Object.entries(gridJson[2])[0];
    return keyValue[1];
  }

  resizeOnSizeChanges(): number {
    return (
      this.fileImage.nativeElement.offsetWidth /
      this.fileImage.nativeElement.naturalWidth
    );
  }

  resizeOnSidebarHidden(): number {
    return (
      (this.fileImage.nativeElement.offsetWidth + this.sidebarWidth) /
      this.fileImage.nativeElement.naturalWidth
    );
  }

  resizeOnSidebarVisible(): number {
    return (
      (this.fileImage.nativeElement.offsetWidth - this.sidebarWidth) /
      this.fileImage.nativeElement.naturalWidth
    );
  }

  deCollapseItems(): void {
    this.data = this.data.map((item, i) => {
      item.collapsed = false;
      return item;
    });
  }

  collapseItem(index: number): void {
    if (typeof this.activeIndex === 'number' && this.activeIndex > -1) {
      if (this.activeIndex === index) {
        this.data = this.data.map((item, i) => {
          item.collapsed = false;
          if (i === this.activeIndex) {
            item.collapsed = true;
          }
          return item;
        });
      } else {
        this.pointer.$itemPointModifier.next({
          active: this.activeIndex,
          newIndex: index,
        });
      }
    }
  }

  resetCoordinates(): void {
    if (!!this.currentEditingPoint)
      this.initialData.push(this.currentEditingPoint);
    this.currentEditingPoint = null;
    this.aspectRatio = this.resizeOnSidebarVisible();
    this.data = JSON.parse(JSON.stringify(this.initialData)).map((item) => {
      item.width = `${
        this.utility.extractValue(item.width) * this.aspectRatio
      }px`;
      item.height = `${
        this.utility.extractValue(item.height) * this.aspectRatio
      }px`;
      item.top = `${this.utility.extractValue(item.top) * this.aspectRatio}px`;
      item.left = `${
        this.utility.extractValue(item.left) * this.aspectRatio
      }px`;
      item.modalTop = `${
        this.utility.extractValue(item.top) +
        this.utility.extractValue(item.height)
      }px`;
      item.collapsed = false;
      return item;
    });
  }

  setCoordinates(event, isInitial: boolean): void {
    this.aspectRatio = isInitial
      ? this.resizeOnSizeChanges()
      : this.resizeOnSidebarVisible();
    this.utility.aspectRatio = this.aspectRatio;
    if (this.data) {
      this.data = JSON.parse(JSON.stringify(this.initialData)).map((item) => {
        item.width = `${
          this.utility.extractValue(item.width) * this.aspectRatio
        }px`;
        item.height = `${
          this.utility.extractValue(item.height) * this.aspectRatio
        }px`;
        item.top = `${
          this.utility.extractValue(item.top) * this.aspectRatio
        }px`;
        item.left = `${
          this.utility.extractValue(item.left) * this.aspectRatio
        }px`;
        item.modalTop = `${
          this.utility.extractValue(item.top) +
          this.utility.extractValue(item.height)
        }px`;
        item.collapsed = false;

        return item;
      });
    }
  }

  updateCoordinates(): void {
    this.aspectRatio = this.resizeOnSidebarHidden();
    this.utility.aspectRatio = this.aspectRatio;
    this.data = JSON.parse(JSON.stringify(this.initialData)).map((item) => {
      item.width = `${
        this.utility.extractValue(item.width) * this.aspectRatio
      }px`;
      item.height = `${
        this.utility.extractValue(item.height) * this.aspectRatio
      }px`;
      item.top = `${this.utility.extractValue(item.top) * this.aspectRatio}px`;
      item.left = `${
        this.utility.extractValue(item.left) * this.aspectRatio
      }px`;
      item.modalTop = `${
        this.utility.extractValue(item.top) +
        this.utility.extractValue(item.height)
      }px`;
      item.collapsed = false;
      return item;
    });
  }

  setCanvasLine(index: number): void {
    if (index !== -1) {
      const c = document.getElementById(`canvas-${index}`) as any;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const topStartPoint =
        this.navItemsHeight * (this.pointer.navItemIndex + 1) -
        this.navItemsHeight / 2;
      const topEndPoint =
        this.utility.extractValue(this.data[index].top) +
        this.toolbarHeight +
        5 -
        this.pointer.offsetTop;
      const leftEndPoint = this.utility.extractValue(this.data[index].left);
      ctx.beginPath();
      ctx.moveTo(0, topStartPoint);
      ctx.lineTo(leftEndPoint, topEndPoint);
      ctx.stroke();
    }
  }
  setGridCanvasLine(index: number): void {
    if (index !== -1) {
      const c = document.getElementById(`canvas-${index}`) as any;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      const topStartPoint =
        this.pointer.sidebarItems.length * this.navItemsHeight +
        this.gridItemsHeaderHeight +
        this.rowTextHeight -
        this.pointer.sidebarOffsetTop +
        this.navItemsHeight * (this.pointer.gridItemIndex + 1) +
        this.activeRowIndex *
          (this.gridItemsHeaderHeight +
            this.pointer.gridItems[0][1].length * this.navItemsHeight -
            this.navItemsHeight);
      const topEndPoint =
        this.utility.extractValue(this.data[index].top) +
        this.toolbarHeight +
        5 -
        this.pointer.offsetTop;
      const leftEndPoint = this.utility.extractValue(this.data[index].left);
      ctx.beginPath();
      ctx.moveTo(0, topStartPoint);
      ctx.lineTo(leftEndPoint, topEndPoint);
      ctx.stroke();
    }
  }
  setOverallColBox(colIndex: number): void {
    if (colIndex !== -1) {
      const c = document.getElementById(
        `grid-canvas-box-${this.activeRowIndex}${this.activeSidebarIndex}`
      ) as any;
      const ctx = c.getContext('2d');
      const col = this.gridData[this.activeRowIndex][1][colIndex][1];
      const leftStartPoint = this.utility.extractValue(col.left);
      const topStartPoint =
        this.utility.extractValue(col.top) +
        this.toolbarHeight -
        this.pointer.offsetTop;
      const boxWidth = this.utility.extractValue(col.width);
      const boxHeight = this.utility.extractValue(col.height);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.strokeStyle = 'green';
      ctx.lintWidth = '6';
      ctx.rect(leftStartPoint, topStartPoint, boxWidth, boxHeight);
      ctx.stroke();
    }
  }

  resetCanvasLine(): void {
    if (typeof this.activeIndex === 'number' && this.activeIndex > -1) {
      const c = document.getElementById(`canvas-${this.activeIndex}`) as any;
      c.style.display = 'none';
    }
  }

  saveChange(newValue: string, key: string): void {
    const mutateIndex: number = this.pointer.sidebarItems.findIndex(
      (item) => item[0] === key
    );
    this.pointer.sidebarItems = this.pointer.sidebarItems.map((item, i) => {
      if (i === mutateIndex) {
        item[1].word = newValue;
        // item[1].key = newValue;
      }
      return item;
    });
    this.updateSidebarItems.next();
  }

  getSidebarItemValue(): string {
    const mutateIndex: number = this.pointer.sidebarItems.findIndex(
      (item) => item[0] === this.activeKey
    );
    return this.pointer.sidebarItems[mutateIndex][1].word;
  }
}
