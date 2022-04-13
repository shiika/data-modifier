import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NAV_ITEM_HEIGHT, TOOLBAR_HEIGHT } from '../enums/constants';
import { PointerService } from '../services/pointer.service';
import { UtilityService } from '../services/utility.service';

@Component({
  selector: 'app-highlighter',
  templateUrl: './highlighter.component.html',
  styleUrls: ['./highlighter.component.scss']
})
export class HighlighterComponent implements OnInit {
  @Input() data: any;
  @ViewChild("fileImage") fileImage: ElementRef;
  aspectRatio: number;
  activeIndex: number;
  navItemsHeight: any = NAV_ITEM_HEIGHT;
  toolbarHeight: number = TOOLBAR_HEIGHT;
  constructor(private pointer: PointerService, private utility: UtilityService) {}

  ngOnInit(): void {
    this.pointer.$itemPointEmitter
      .subscribe(
        (index: number) => {
          this.activeIndex = index;
          this.setCanvasLine(index);
        }
      );
  }

  resizeOnSizeChanges(): number {
    return this.fileImage.nativeElement.offsetWidth / this.fileImage.nativeElement.naturalWidth
  }

  collapseItem(index: number): void {
    this.data = this.data.map(
      (item, i) => {
        item[1].collapsed = false;
        if (i === index) {
          item[1].collapsed = true;
        }
        return item
      }
    );
  }

  setCoordinates(): void {
    this.aspectRatio = this.resizeOnSizeChanges();
    this.data = this.data.map(
      item => {
        item[1].width = `${this.utility.extractValue(item[1].width) * this.aspectRatio}px`;
        item[1].height = `${this.utility.extractValue(item[1].height) * this.aspectRatio}px`;
        item[1].top = `${this.utility.extractValue(item[1].top) * this.aspectRatio}px`;
        item[1].left = `${this.utility.extractValue(item[1].left) * this.aspectRatio}px`;
        item[1].modalTop = `${this.utility.extractValue(item[1].top) + this.utility.extractValue(item[1].height)}px`;
        item[1].collapsed = false;
        return item
      }
    );
  }

  setCanvasLine(index: number): void {
      const c = (document.getElementById(`canvas-${this.activeIndex}`) as any);
      const ctx = c.getContext("2d");
      const topStartPoint = (this.navItemsHeight * (index + 1) - this.navItemsHeight / 2);
      const topEndPoint = this.utility.extractValue(this.data[index][1].top) + this.toolbarHeight + 5;
      const leftEndPoint = this.utility.extractValue(this.data[index][1].left);
      ctx.beginPath();
      ctx.moveTo(0, topStartPoint);
      ctx.lineTo(leftEndPoint, topEndPoint);
      ctx.stroke();
  }

  saveChange(newValue: string, key: string): void {
    const index: number = this.data.findIndex(item => item[0] === key);
    this.data[index][1].word = newValue;
  }

}
