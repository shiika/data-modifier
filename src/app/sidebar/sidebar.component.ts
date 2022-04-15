import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import jsonData from '../../assets/all_ocr.json';
import objectiveItems from '../../assets/objectives_example.json';
import { PointerService } from '../services/pointer.service';
import { HighlighterComponent } from '../highlighter/highlighter.component';
import { UtilityService } from '../services/utility.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @ViewChild('highlighter') highlighterElement: HighlighterComponent;
  allPoints: { [key: string]: any }[] = JSON.parse(JSON.stringify(jsonData));
  sidebarItems: { [key: string]: any }[] = JSON.parse(
    JSON.stringify(objectiveItems)
  );
  sidebarIndex: number;
  activeKey: string;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private pointer: PointerService,
    private utility: UtilityService
  ) {}

  ngOnInit(): void {
    this.pointer.allPoints = this.allPoints.map((item) => {
      item.modalTop = `${item['top-left-point'][0] + item.height}px`;
      item.width = `${item.width}px`;
      item.height = `${item.height}px`;
      item.top = `${item['top-left-point'][0]}px`;
      item.left = `${item['top-left-point'][1]}px`;
      item.collapsed = false;
      item.key = item.word;
      return item;
    });
    this.updateAllPoints();
    this.pointer.sidebarItems = this.sidebarItems.map((item) => {
      const point = Object.entries(item)[0];
      if (point[1].length > 1) {
        point[1] = point[1].reduce(
          (acc, item) => {
            return {
              'page-index': acc['page-index'],
              word: acc.word,
              'top-left-point': acc['top-left-point'],
              width: acc.width + item.width,
              height: acc.height,
              key: acc.key,
            };
          },
          {
            'page-index': point[1][0]['page-index'],
            word: point[1][0].word,
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
            this.pointer.allPoints[value.newIndex].key = item[1].word;
            item[1].key = this.allPoints[value.newIndex].key;
            this.updateAllPoints();
            this.activeKey = this.allPoints[value.newIndex].key;
          }
          return item;
        });
        this.updateSidebarItems();
        console.log(this.sidebarItems[this.sidebarIndex]);
        this.toggleItem(this.activeKey, this.sidebarIndex);
      }
    );
  }

  updateSidebarItems(): void {
    this.sidebarItems = this.pointer.sidebarItems;
    this.updateAllPoints();
  }

  updateAllPoints(): void {
    this.allPoints = this.pointer.allPoints;
  }

  toggleItem(key: string, index: number): void {
    this.activeKey = key;
    this.sidebarIndex = index;
    this.pointer.navItemIndexSetter = index;
    this.pointer.$itemPointEmitter.next(key);
  }

  resetPointer(): void {
    this.pointer.$itemPointEmitter.next(null);
  }
}
