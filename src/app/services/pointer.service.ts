import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PointerService {
  $itemPointEmitter: Subject<string> = new Subject<string>();
  $itemPointModifier: Subject<{ active: number; newIndex: number }> =
    new Subject<{ active: number; newIndex: number }>();
  $navItemIndex: number;
  $sidebarItems: any[];
  $allPoints: any[];
  offsetTop: number = 0;

  get navItemIndex(): number {
    return this.$navItemIndex;
  }
  set navItemIndexSetter(index: number) {
    this.$navItemIndex = index;
  }

  get sidebarItems(): any[] {
    return this.$sidebarItems;
  }

  set sidebarItems(newItems: any[]) {
    this.$sidebarItems = newItems;
  }

  get allPoints(): any[] {
    return this.$allPoints;
  }

  set allPoints(newItems: any[]) {
    this.$allPoints = newItems;
  }
  constructor() {}
}
