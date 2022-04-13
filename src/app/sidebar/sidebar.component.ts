import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import jsonData from "../../assets/data.json";
import { PointerService } from '../services/pointer.service';
import { HighlighterComponent } from '../highlighter/highlighter.component';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @ViewChild("highlighter") highlighterElement: HighlighterComponent;
  data: {[key: string]: any}[] = JSON.parse(JSON.stringify(jsonData));
  activeIndex: number;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver, 
    private pointer: PointerService
    ) {}

  ngOnInit(): void {
    this.data = this.data.map(
      item => {
        item = Object.entries(item)[0];
        item[1].modalTop = `${item[1]['top-left-point'][0] + item[1].height}px`;
        item[1].width = `${item[1].width}px`;
        item[1].height = `${item[1].height}px`;
        item[1].top = `${item[1]['top-left-point'][0]}px`;
        item[1].left = `${item[1]['top-left-point'][1]}px`;
        item[1].collapsed = false;
        return item
      }
    );
  }

  toggleItem(index: number, key: string): void {
    this.activeIndex = index;
    this.pointer.$itemPointEmitter.next(index);
  }

}
