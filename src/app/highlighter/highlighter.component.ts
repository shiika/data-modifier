import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
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
import { GRID_COORDS } from '../enums/grid-coords';
import { GridService } from '../services/grid.service';
import { PointerService } from '../services/pointer.service';
import { UtilityService } from '../services/utility.service';

@Component({
  selector: 'app-highlighter',
  templateUrl: './highlighter.component.html',
  styleUrls: ['./highlighter.component.scss'],
})
export class HighlighterComponent implements OnInit, OnChanges {
  @Input() data: any;
  @ViewChild('fileImage') fileImage: ElementRef;
  @Output() updateSidebarItems: EventEmitter<any> = new EventEmitter<any>();
  @Input() gridData: any;
  @Input() isEditGrid: boolean;
  aspectRatio: number;
  activeIndex: number;
  activeSidebarIndex: number;
  activeRowIndex: number;
  activeKey: string;
  navItemsHeight: any = NAV_ITEM_HEIGHT;
  toolbarHeight: number = TOOLBAR_HEIGHT;
  gridItemsHeaderHeight: number = GRID_ITEMS_HEADER_HEIGHT;
  rowTextHeight: number = ROW_TEXT_HEIGHT;
  gridCoords: { [key: string]: number } = GRID_COORDS;
  sidebarWidth: number = SIDEBAR_WIDTH;
  constructor(
    private pointer: PointerService,
    private utility: UtilityService,
    private grid: GridService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.isEditGrid) {
      this.grid.initAndResizeCanvas();
      this.resetCoordinates();
    } else {
      if (!changes['isEditGrid'].firstChange) {
        this.setCoordinates(null, false);
      }
    }
  }

  ngOnInit(): void {
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
    });
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
          this.setOverallColBox(this.activeSidebarIndex);
          // this.collapseItem(this.activeIndex);
        }
        // else {
        //   this.resetCanvasLine();
        //   this.activeIndex = -1;
        //   this.deCollapseItems();
        // }
      }
    );
  }

  resizeOnSizeChanges(): number {
    return (
      this.fileImage.nativeElement.offsetWidth /
      this.fileImage.nativeElement.naturalWidth
    );
  }

  resizeOnSidebarHidden(): number {
    return (
      (this.fileImage.nativeElement.clientWidth + this.sidebarWidth) /
      this.fileImage.nativeElement.clientWidth
    );
  }

  resizeOnSidebarVisible(): number {
    return (
      (this.fileImage.nativeElement.offsetWidth - this.sidebarWidth) /
      this.fileImage.nativeElement.offsetWidth
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

  setCoordinates(event, isInitial: boolean): void {
    this.aspectRatio = isInitial
      ? this.resizeOnSizeChanges()
      : this.resizeOnSidebarVisible();
    this.data = this.data.map((item) => {
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

  resetCoordinates(): void {
    this.aspectRatio = this.resizeOnSidebarHidden();
    this.data = this.data.map((item) => {
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
  setGridCanvasLine(index: number): void {
    const c = document.getElementById(`canvas-${index}`) as any;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    const topStartPoint =
      this.pointer.sidebarItems.length * this.navItemsHeight +
      this.gridItemsHeaderHeight +
      this.rowTextHeight -
      this.pointer.sidebarOffsetTop +
      this.navItemsHeight * (this.pointer.gridItemIndex + 1);
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
  setOverallColBox(colIndex: number): void {
    const c = document.getElementById(
      `grid-canvas-box-${this.activeRowIndex}${this.activeSidebarIndex}`
    ) as any;
    const ctx = c.getContext('2d');
    const col = this.gridData[this.activeRowIndex][1][colIndex][1];
    const leftStartPoint =
      this.utility.extractValue(col.left) * this.aspectRatio;
    const topStartPoint =
      this.utility.extractValue(col.top) * this.aspectRatio +
      this.toolbarHeight -
      this.pointer.offsetTop;
    const boxWidth = this.utility.extractValue(col.width) * this.aspectRatio;
    const boxHeight = this.utility.extractValue(col.height) * this.aspectRatio;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.lintWidth = '6';
    ctx.rect(leftStartPoint, topStartPoint, boxWidth, boxHeight);
    ctx.stroke();
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
