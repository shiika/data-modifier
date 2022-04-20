import { Injectable } from '@angular/core';
import { TOOLBAR_HEIGHT } from '../enums/constants';
import { Rect } from '../enums/grid-coords';
import { PointerService } from './pointer.service';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  static pointer;
  static toolbarHeight: number = TOOLBAR_HEIGHT;
  constructor(public pointerService: PointerService) {
    GridService.pointer = pointerService;
  }
  initAndResizeCanvas(gridCoords: Rect): void {
    var canvas = document.getElementById('grid-canvas') as HTMLCanvasElement,
      ctx = canvas.getContext('2d'),
      rect: Rect = {}, //  w   w   w . d   e   m  o  2 s  .  c  o  m
      drag = false,
      dragBL,
      dragTR,
      dragBR,
      mouseX,
      mouseY,
      closeEnough = 10,
      dragTL = (dragBL = dragTR = dragBR = false);
    function init() {
      canvas.addEventListener('mousedown', mouseDown, false);
      canvas.addEventListener('mouseup', mouseUp, false);
      canvas.addEventListener('mousemove', mouseMove, false);
      rect = {
        startX: gridCoords.startX,
        startY: gridCoords.startY,
        w: gridCoords.w,
        h: gridCoords.h,
      };
    }
    function mouseDown(e) {
      console.log(GridService.pointer);
      mouseX = e.pageX - this.offsetLeft;
      mouseY =
        e.pageY -
        this.offsetTop -
        GridService.toolbarHeight +
        GridService.pointer.offsetTop;
      // if there isn't a rect yet
      if (rect.w === undefined) {
        rect.startX = mouseY;
        rect.startY = mouseX;
        dragBR = true;
      }
      // if there is, check which corner
      //   (if any) was clicked
      //
      // 4 cases:
      // 1. top left
      else if (
        checkCloseEnough(mouseX, rect.startX) &&
        checkCloseEnough(mouseY, rect.startY)
      ) {
        dragTL = true;
      }
      // 2. top right
      else if (
        checkCloseEnough(mouseX, rect.startX + rect.w) &&
        checkCloseEnough(mouseY, rect.startY)
      ) {
        dragTR = true;
      }
      // 3. bottom left
      else if (
        checkCloseEnough(mouseX, rect.startX) &&
        checkCloseEnough(mouseY, rect.startY + rect.h)
      ) {
        dragBL = true;
      }
      // 4. bottom right
      else if (
        checkCloseEnough(mouseX, rect.startX + rect.w) &&
        checkCloseEnough(mouseY, rect.startY + rect.h)
      ) {
        dragBR = true;
      }
      // (5.) none of them
      else {
        // handle not resizing
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
    }
    function checkCloseEnough(p1, p2) {
      return Math.abs(p1 - p2) < closeEnough;
    }
    function mouseUp() {
      dragTL = dragTR = dragBL = dragBR = false;
    }
    function mouseMove(e) {
      mouseX = e.pageX - this.offsetLeft;
      mouseY =
        e.pageY -
        this.offsetTop +
        GridService.pointer.offsetTop -
        GridService.toolbarHeight;
      if (dragTL) {
        rect.w += rect.startX - mouseX;
        rect.h += rect.startY - mouseY;
        rect.startX = mouseX;
        rect.startY = mouseY;
      } else if (dragTR) {
        rect.w = Math.abs(rect.startX - mouseX);
        rect.h += rect.startY - mouseY;
        rect.startY = mouseY;
      } else if (dragBL) {
        rect.w += rect.startX - mouseX;
        rect.h = Math.abs(rect.startY - mouseY);
        rect.startX = mouseX;
      } else if (dragBR) {
        rect.w = Math.abs(rect.startX - mouseX);
        rect.h = Math.abs(rect.startY - mouseY);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
    }
    function draw() {
      ctx.fillStyle = 'transparent';
      ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
      drawHandles();
    }
    function drawCircle(x, y, radius) {
      ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    function drawHandles() {
      drawCircle(rect.startX, rect.startY, closeEnough);
      drawCircle(rect.startX + rect.w, rect.startY, closeEnough);
      drawCircle(rect.startX + rect.w, rect.startY + rect.h, closeEnough);
      drawCircle(rect.startX, rect.startY + rect.h, closeEnough);
    }
    init();
  }
}
