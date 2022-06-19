import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Column, Rect, Row } from '../enums/grid-coords';

@Injectable({
  providedIn: 'root',
})
export class PointerService {
  $itemPointEmitter: Subject<string> = new Subject<string>();
  $gridItemPointEmitter: Subject<{ col: any; rowIndex: number }> = new Subject<{
    col: any;
    rowIndex: number;
  }>();
  $itemPointModifier: Subject<{ active: number; newIndex: number }> =
    new Subject<{ active: number; newIndex: number }>();
  $gridCoords: Subject<Rect> = new Subject<Rect>();
  $gridCols: Subject<Record<string, Column>[]> = new Subject<
    Record<string, Column>[]
  >();
  $selectedBox: BehaviorSubject<{
    top: string;
    left: string;
    width: string;
    height: string;
    page_index: string;
  }> = new BehaviorSubject<{
    top: string;
    left: string;
    width: string;
    height: string;
    page_index: string;
  }>(null);
  $gridRows: Subject<Row[]> = new Subject<Row[]>();
  $updateGrid: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  gridBoxJson: string;
  $navItemIndex: number;
  $gridItemIndex: number;
  $sidebarItems: any[];
  $gridItems: any[] = [];
  offsetTop: number = 0;
  sidebarOffsetTop: number = 0;
  currentPageIndex: number = 0;
  currentRowIndex: number = 0;
  gridCols: Record<string, Column>[];
  gridRows: any[];

  get navItemIndex(): number {
    return this.$navItemIndex;
  }
  set navItemIndexSetter(index: number) {
    this.$navItemIndex = index;
  }
  get gridItemIndex(): number {
    return this.$gridItemIndex;
  }
  set gridItemIndexSetter(index: number) {
    this.$gridItemIndex = index;
  }

  get sidebarItems(): any[] {
    return this.$sidebarItems;
  }

  set sidebarItems(newItems: any[]) {
    this.$sidebarItems = newItems;
  }
  get gridItems(): any[] {
    return this.$gridItems;
  }

  set gridItems(newItems: any[]) {
    this.$gridItems = newItems;
  }
  constructor() {}

  mapGridItems(item: any): boolean {
    const point: any = Object.entries(item)[0];
    if (point[1][0] instanceof Array) {
      point[1].forEach((row, rowIndex) => {
        row = row.map((colObject) => {
          const col: [string, any] = Object.entries(colObject)[0];
          if (col[1].length > 1) {
            col[1] = col[1].reduce(
              (acc, item, i) => {
                return {
                  'page-index': acc['page-index'],
                  word: `${acc.word}${col[1][i].word}`,
                  'top-left-point': acc['top-left-point'],
                  width: acc.width + item.width,
                  height: acc.height,
                  top: acc.top,
                  left: acc.left,
                  key: acc.key,
                  row: rowIndex,
                };
              },
              {
                'page-index': 1,
                word: '',
                'top-left-point': col[1][0]['top-left-point'],
                width: 0,
                height: col[1][0].height,
                top: col[1][0]['top-left-point'][0],
                left: col[1][0]['top-left-point'][1],
                key: col[1][0].word,
                row: rowIndex,
              }
            );
            col[1].width = `${col[1].width}px`;
            col[1].height = `${col[1].height}px`;
            col[1].top = `${col[1]['top-left-point'][0]}px`;
            col[1].left = `${col[1]['top-left-point'][1]}px`;
          } else if (col[1].length === 1) {
            col[1] = col[1][0];
            col[1].modalTop = `${
              col[1]['top-left-point'][0] + col[1].height
            }px`;
            col[1].width = `${col[1].width}px`;
            col[1].height = `${col[1].height}px`;
            col[1].top = `${col[1]['top-left-point'][0]}px`;
            col[1].left = `${col[1]['top-left-point'][1]}px`;
            col[1].collapsed = false;
            col[1].key = col[1].word;
          }
          return col;
        });
        row = [`row ${rowIndex + 1}`, [...row]];
        this.gridItems = [...this.gridItems, row];
      });
    }
    return !(point[1][0] instanceof Array);
  }
}
