import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Rect } from '../enums/grid-coords';

@Injectable({
  providedIn: 'root',
})
export class PointerService {
  $itemPointEmitter: Subject<string> = new Subject<string>();
  $gridItemPointEmitter: Subject<{ key: string; rowIndex: number }> =
    new Subject<{ key: string; rowIndex: number }>();
  $itemPointModifier: Subject<{ active: number; newIndex: number }> =
    new Subject<{ active: number; newIndex: number }>();
  $gridCoords: Subject<Rect> = new Subject<Rect>();
  $navItemIndex: number;
  $gridItemIndex: number;
  $sidebarItems: any[];
  $gridItems: any[] = [];
  allPoints: any[];
  offsetTop: number = 0;
  sidebarOffsetTop: number = 0;

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

  // get allPoints(): any[] {
  //   return this.$allPoints;
  // }

  // set allPoints(newItems: any[]) {
  //   this.$allPoints = newItems;
  // }
  constructor() {}
}
