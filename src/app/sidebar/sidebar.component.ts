import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
// import jsonData from '../../assets/all_ocr.json';
// import objectiveItems from '../../assets/objectives_example.json';
import { PointerService } from '../services/pointer.service';
import { HighlighterComponent } from '../highlighter/highlighter.component';
import { TOOLBAR_HEIGHT } from '../enums/constants';
import { MatSidenavContent } from '@angular/material/sidenav';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { UtilityService } from '../services/utility.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('highlighter') highlighterElement: HighlighterComponent;
  @ViewChild(MatSidenavContent) $sidenavComponent: MatSidenavContent;
  allPoints: { [key: string]: any }[] = [];
  // sidebarItems: { [key: string]: any }[] = JSON.parse(
  //   JSON.stringify(objectiveItems)
  // );
  images: string[] = [];
  sidebarItems: { [key: string]: any }[];
  sidebarIndex: number;
  sidebarGridIndex: number;
  activeKey: string;
  toolbarHeight: number = TOOLBAR_HEIGHT;
  gridItems: any[] = [];
  isEditGrid: boolean = false;
  isSelectionBox: boolean = false;
  isGridEditted: boolean = false;
  currentImage: string;
  currentPageIndex: number;

  // isHandset$: Observable<boolean> = this.breakpointObserver
  //   .observe(Breakpoints.Handset)
  //   .pipe(
  //     map((result) => result.matches),
  //     shareReplay()
  //   );

  constructor(
    public pointer: PointerService,
    private api: ApiService,
    private router: Router,
    private utility: UtilityService
  ) {}

  ngOnInit(): void {
    if (!this.api.isActive) this.router.navigate(['']);
    else {
      this.images = this.api.images;
      this.currentPageIndex = 0;
      this.pointer.currentPageIndex = this.currentPageIndex;
      this.currentImage = this.images[0];
      this.customizePage();
      this.pointer.$updateGrid.subscribe((gridJson) => {
        if (gridJson) {
          // this.allPoints = this.allPoints.filter((point) => {
          //   return !point.isGrid;
          // });
          let grid: any = Object.values(JSON.parse(gridJson)[0])[0];
          grid = grid.map((row, i) => {
            const rowIndex = i;
            row = row.map((col) => {
              const [key, value] = Object.entries(col)[0];
              value[0] = {
                height: `${value[0].height}px`,
                width: `${value[0].width}px`,
                key: `${value[0].word}`,
                word: `${value[0].word}`,
                row: rowIndex,
                'top-left-point': value[0]['top-left-point'],
                top: `${value[0]['top-left-point'][0]}px`,
                left: `${value[0]['top-left-point'][1]}px`,
                'page-index': value[0]['page-index'],
              };
              // if (
              //   this.allPoints.findIndex(
              //     (point) => point.word == value[0].word
              //   ) === -1
              // ) {
              //   this.allPoints = this.allPoints.concat([
              //     { ...value[0], isGrid: true },
              //   ]);
              // }
              return [key, value[0]];
            });
            return [`row ${i + 1}`, row];
          });
          this.pointer.gridItems = grid;
          this.updateGridItems();
          this.isGridEditted = true;
        }
      });
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
              this.activeKey = this.allPoints[value.newIndex].key;
            }
            return item;
          });
          this.updateSidebarItems();
          this.toggleItem(this.activeKey, this.sidebarIndex);
        }
      );
    }
  }

  ngAfterViewInit(): void {
    const sidebar = document.querySelector('.mat-drawer-inner-container');
    sidebar.addEventListener('scroll', (e: Event) => {
      this.pointer.sidebarOffsetTop = e.target['scrollTop'];
    });
  }

  changePage(): void {
    this.pointer.gridItems = [];
    if (this.currentPageIndex === 0) {
      this.currentPageIndex = 1;
      this.pointer.currentPageIndex = this.currentPageIndex;
      this.currentImage = this.images[this.currentPageIndex];
      this.customizePage();
    } else {
      this.currentPageIndex = 0;
      this.pointer.currentPageIndex = this.currentPageIndex;
      this.currentImage = this.images[this.currentPageIndex];
      this.customizePage();
    }
  }

  customizePage(): void {
    this.sidebarItems = JSON.parse(JSON.stringify(this.api.objectives));
    this.mapAllPoints();
    this.pointer.sidebarItems = this.sidebarItems
      .filter(this.mapGridItems.bind(this))
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
    this.updateGridItems();
  }

  mapAllPoints(): void {
    this.allPoints = JSON.parse(JSON.stringify(this.api.allPoints)).map(
      (item) => {
        item.modalTop = `${item['top-left-point'][0] + item.height}px`;
        item.width = `${item.width}px`;
        item.height = `${item.height}px`;
        item.top = `${item['top-left-point'][0]}px`;
        item.left = `${item['top-left-point'][1]}px`;
        item.collapsed = false;
        item.key = item.word;
        return item;
      }
    );
  }

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
            col[1].row = rowIndex;
          }
          return col;
        });
        row = [`row ${rowIndex + 1}`, [...row]];
        this.pointer.gridItems = [...this.pointer.gridItems, row];
      });
    }
    return !(point[1][0] instanceof Array);
  }

  updateSidebarItems(): void {
    this.sidebarItems = this.pointer.sidebarItems.filter(([rowIndex, row]) => {
      return row['page-index'] === this.pointer.currentPageIndex;
    });
    this.pointer.sidebarItems = this.sidebarItems;
  }
  updateGridItems(): void {
    this.gridItems = this.pointer.gridItems.map(([index, cols]) => {
      cols = cols.filter(([colIndex, col]) => {
        col.name = colIndex;
        return col['page-index'] === this.pointer.currentPageIndex;
      });
      return [index, cols];
    });
    this.pointer.gridItems = this.gridItems;
  }

  toggleItem(key: string, index: number): void {
    this.activeKey = key;
    this.sidebarIndex = index;
    this.pointer.$gridItemIndex = undefined;
    this.pointer.navItemIndexSetter = index;
    this.pointer.$itemPointEmitter.next(key);
    if (document.querySelector('#added-col'))
      document
        .querySelector('.wrapper__image')
        .removeChild(document.querySelector('#added-col'));
  }

  toggleGridItem(col: any, index: number, rowIndex: number): void {
    this.sidebarGridIndex = index;
    this.pointer.$navItemIndex = undefined;
    this.pointer.gridItemIndexSetter = index;
    this.pointer.currentRowIndex = rowIndex;
    this.pointer.$gridItemPointEmitter.next({ col, rowIndex });
  }

  resetPointer(e: Event): void {
    this.pointer.offsetTop = e.target['scrollTop'];
    this.pointer.$itemPointEmitter.next(null);
    this.pointer.$gridItemPointEmitter.next({ col: null, rowIndex: null });
    if (!this.isSelectionBox) {
      this.pointer.$navItemIndex = undefined;
      this.pointer.$gridItemIndex = undefined;
    }
    if (document.querySelector('#added-col'))
      document
        .querySelector('.wrapper__image')
        .removeChild(document.querySelector('#added-col'));
  }

  editGrid(): void {
    this.$sidenavComponent.getElementRef().nativeElement.scrollTo(0, 0);
    this.pointer.$navItemIndex = undefined;
    this.pointer.$gridItemIndex = undefined;
    this.pointer.gridItemIndexSetter = undefined;
    this.pointer.currentRowIndex = undefined;
    // this.pointer.offsetTop = e.target['scrollTop'];
    this.pointer.$itemPointEmitter.next(null);
    this.pointer.$gridItemPointEmitter.next({ col: null, rowIndex: null });
    this.isEditGrid = !this.isEditGrid;
    // if (this.isEditGrid) {
    //   this.allPoints = this.allPoints.filter((point) => {
    //     return !point.isGrid;
    //   });
    // }
    if (!this.isEditGrid) {
      const formData = new FormData();
      formData.append('grid_json', this.pointer.gridBoxJson);
      formData.append('allocr', JSON.stringify(this.api.allPoints));
      this.api
        .updateGrid(formData)
        .pipe(take(1))
        .subscribe((res) => {
          if (res) {
            this.pointer.$updateGrid.next(res);
          }
        });
    } else {
      // this.allPoints = this.allPoints.filter((point) => {
      //   return !point.isGrid;
      // });
    }
    if (document.querySelector('#added-col'))
      document
        .querySelector('.wrapper__image')
        .removeChild(document.querySelector('#added-col'));
  }

  selectByHighlight(): void {
    this.$sidenavComponent.getElementRef().nativeElement.scrollTo(0, 0);
    this.isSelectionBox = !this.isSelectionBox;
  }

  resetSelectionBox(): void {
    this.pointer.$navItemIndex = undefined;
    this.pointer.$gridItemIndex = undefined;
    this.isSelectionBox = false;
  }

  export(): void {
    let exportedData: any[] = [];
    const gridData = {};
    for (let item of this.pointer.sidebarItems) {
      exportedData.push({
        [item[0]]: [{ word: item[1].word }],
      });
    }
    const gridItems = this.gridItems.map((item) => {
      item[1] = item[1].map((col) => {
        return [col[0], { word: col[1].word }];
      });
      return item;
    });
    exportedData.push(gridItems);
    let dataStr = JSON.stringify(exportedData);
    let dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'data.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  addColumn(): void {
    let additionalPoint: { [key: string]: any };
    this.gridItems.forEach((row, i) => {
      additionalPoint = Object.assign({}, this.gridItems[0][1][0][1]);
      additionalPoint['page-index'] = this.pointer.currentPageIndex;
      additionalPoint.row = i;
      additionalPoint.word = 'additional point';
      additionalPoint.key = 'additional point';
      additionalPoint.left = `${additionalPoint['top-left-point'][1] + 10}px`;
      additionalPoint.top = `${
        additionalPoint['top-left-point'][0] + i * 10
      }px`;
      additionalPoint.name = `added-col`;
      row[1].push([`added-col`, additionalPoint]);
      // this.pointer.$gridItemPointEmitter.next({
      //   col: additionalPoint,
      //   rowIndex: 0,
      // });
    });
    this.pointer.gridItems = this.gridItems;
    this.gridItems = this.pointer.gridItems;
    this.pointer.$gridCols.next([
      ...this.pointer.gridCols,
      {
        additionalCol: {
          startX: this.utility.extractValue(additionalPoint.left),
          isDrag: false,
          name: 'additional-col',
        },
      },
    ]);
    this.pointer.$gridItemPointEmitter.next({
      col: null,
      rowIndex: 0,
    });
  }
  addRow(): void {}
}
