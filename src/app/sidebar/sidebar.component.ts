import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import jsonData from '../../assets/all_ocr.json';
import objectiveItems from '../../assets/objectives_example.json';
import { PointerService } from '../services/pointer.service';
import { HighlighterComponent } from '../highlighter/highlighter.component';
import { TOOLBAR_HEIGHT } from '../enums/constants';
import { GridService } from '../services/grid.service';
// import { MatSidenavContent } from '@angular/material/sidenav';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('highlighter') highlighterElement: HighlighterComponent;
  @ViewChild('sidenavContent') sidenavContentElement: any;
  allPoints: { [key: string]: any }[] = [];
  sidebarItems: { [key: string]: any }[] = JSON.parse(
    JSON.stringify(objectiveItems)
  );
  sidebarIndex: number;
  sidebarGridIndex: number;
  activeKey: string;
  toolbarHeight: number = TOOLBAR_HEIGHT;
  gridItems: { [key: string]: any }[] = [];
  isEditGrid: boolean = false;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private pointer: PointerService
  ) {}

  ngOnInit(): void {
    this.mapAllPoints();
    this.pointer.sidebarItems = this.sidebarItems
      .filter((item) => {
        const point = Object.entries(item)[0];
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
                    'page-index': col[1][0]['page-index'],
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
            this.pointer.gridItems = [...this.pointer.gridItems, row];
          });
        }
        this.updateGridItems();
        return !(point[1][0] instanceof Array);
      })
      .map((item) => {
        const point = Object.entries(item)[0];
        if (point[1].length > 1) {
          point[1] = point[1].reduce(
            (acc, item, i) => {
              return {
                'page-index': acc['page-index'],
                word: `${acc.word}${point[1][i].word}`,
                'top-left-point': acc['top-left-point'],
                width: acc.width + item.width,
                height: acc.height,
                key: acc.key,
              };
            },
            {
              'page-index': point[1][0]['page-index'],
              word: '',
              'top-left-point': point[1][0]['top-left-point'],
              width: point[1][0].width,
              height: point[1][0].height,
              key: point[1][0].word,
            }
          );
        } else {
          point[1] = point[1][0];
          point[1].modalTop = `${
            point[1]['top-left-point'][0] + point[1].height
          }px`;
          point[1].width = `${point[1].width}px`;
          point[1].height = `${point[1].height}px`;
          point[1].top = `${point[1]['top-left-point'][0]}px`;
          point[1].left = `${point[1]['top-left-point'][1]}px`;
          point[1].collapsed = false;
          point[1].key = point[1].word;
        }
        return point;
      });
    this.updateSidebarItems();
    this.pointer.$itemPointModifier.subscribe(
      (value: { active: number; newIndex: number }) => {
        this.pointer.sidebarItems = this.sidebarItems.map((item, i) => {
          if (i === this.sidebarIndex) {
            item[1]['page-index'] =
              this.allPoints[value.newIndex]['page-index'];
            item[1].top = this.allPoints[value.newIndex].top;
            item[1].left = this.allPoints[value.newIndex].left;
            item[1].width = this.allPoints[value.newIndex].width;
            item[1].height = this.allPoints[value.newIndex].height;
            item[1].modalTop = this.allPoints[value.newIndex].modalTop;
            item[1].word = this.allPoints[value.newIndex].word;
            this.allPoints[value.newIndex].key = item[1].word;
            item[1].key = this.allPoints[value.newIndex].key;
            // this.updateAllPoints();
            this.activeKey = this.allPoints[value.newIndex].key;
          }
          return item;
        });
        this.updateSidebarItems();
        this.toggleItem(this.activeKey, this.sidebarIndex);
      }
    );
  }

  ngAfterViewInit(): void {
    const sidebar = document.querySelector('.mat-drawer-inner-container');
    sidebar.addEventListener('scroll', (e: Event) => {
      this.pointer.sidebarOffsetTop = e.target['scrollTop'];
    });
  }

  mapAllPoints(): void {
    this.allPoints = JSON.parse(JSON.stringify(jsonData)).map((item) => {
      item.modalTop = `${item['top-left-point'][0] + item.height}px`;
      item.width = `${item.width}px`;
      item.height = `${item.height}px`;
      item.top = `${item['top-left-point'][0]}px`;
      item.left = `${item['top-left-point'][1]}px`;
      item.collapsed = false;
      item.key = item.word;
      return item;
    });
    // this.updateAllPoints();
  }

  updateSidebarItems(): void {
    this.sidebarItems = this.pointer.sidebarItems;
    // this.updateAllPoints();
  }
  updateGridItems(): void {
    this.gridItems = this.pointer.gridItems;
    // this.updateAllPoints();
  }

  updateAllPoints(): void {
    this.pointer.allPoints = this.allPoints;
  }

  toggleItem(key: string, index: number): void {
    this.activeKey = key;
    this.sidebarIndex = index;
    this.pointer.navItemIndexSetter = index;
    this.pointer.$itemPointEmitter.next(key);
  }

  toggleGridItem(key: string, index: number, rowIndex: number): void {
    this.sidebarGridIndex = index;
    this.pointer.gridItemIndexSetter = index;
    this.pointer.$gridItemPointEmitter.next({ key, rowIndex });
  }

  resetPointer(e: Event): void {
    this.pointer.offsetTop = e.target['scrollTop'];
    this.pointer.$itemPointEmitter.next(null);
    this.pointer.$gridItemPointEmitter.next({ key: null, rowIndex: null });
  }

  editGrid(): void {
    this.isEditGrid = !this.isEditGrid;
  }

  export(): void {
    let exportedData: any[] = [];
    for (let item of this.pointer.sidebarItems) {
      exportedData.push({
        [item[0]]: [{ word: item[1].word }],
      });
    }
    let dataStr = JSON.stringify(exportedData);
    let dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}
