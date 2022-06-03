import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SIDEBAR_WIDTH, TOOLBAR_HEIGHT } from '../enums/constants';
import { Column, Rect, Row } from '../enums/grid-coords';
import { PointerService } from './pointer.service';
import { UtilityService } from './utility.service';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  static pointer;
  static utility;
  static toolbarHeight: number = TOOLBAR_HEIGHT;
  static sidebarWidth: number = SIDEBAR_WIDTH;
  static cols: Column[];
  static rows: Row[];
  constructor(
    public pointerService: PointerService,
    public utilityService: UtilityService
  ) {
    GridService.pointer = pointerService;
    GridService.utility = utilityService;
  }

  private static mapCols(cols: Record<string, Column>[]): Column[] {
    this.cols = cols.map((col) => {
      const [name, value] = Object.entries(col)[0]; // Extracting col object
      value.isDrag = false;
      value.name = name;
      return value;
    });
    return this.cols;
  }

  private static mapRows(rows: Row[]): Row[] {
    this.rows = rows.map((row) => {
      row.isDrag = false;
      return row;
    });
    return this.rows;
  }

  selectByHighlight(): void {
    var canvas = document.getElementById(
        'selection-canvas'
      ) as HTMLCanvasElement,
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
        startX: 0,
        startY: 0,
        w: 20,
        h: 20,
      };
    }

    function mouseDown(e) {
      mouseX = e.pageX - this.offsetLeft - GridService.sidebarWidth;
      mouseY =
        e.pageY -
        this.offsetTop -
        GridService.toolbarHeight +
        GridService.pointer.offsetTop;
      rect.startX = mouseX;
      rect.startY = mouseY;
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
      // else if (
      //   checkCloseEnough(mouseX, rect.startX) &&
      //   checkCloseEnough(mouseY, rect.startY)
      // ) {
      // dragTL = true;
      // }
      // // 2. top right
      // else if (
      //   checkCloseEnough(mouseX, rect.startX + rect.w) &&
      //   checkCloseEnough(mouseY, rect.startY)
      // ) {
      // dragTR = true;
      // }
      // // 3. bottom left
      // else if (
      //   checkCloseEnough(mouseX, rect.startX) &&
      //   checkCloseEnough(mouseY, rect.startY + rect.h)
      // ) {
      //   dragBL = true;
      // }
      // // 4. bottom right
      // else if (
      //   checkCloseEnough(mouseX, rect.startX + rect.w) &&
      //   checkCloseEnough(mouseY, rect.startY + rect.h)
      // ) {
      dragBR = true;
      // }
      // // (5.) none of them
      // else {
      //   // handle not resizing
      // }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
    }

    function checkCloseEnough(p1, p2) {
      return Math.abs(p1 - p2) < closeEnough;
    }
    function mouseUp() {
      dragTL = dragTR = dragBL = dragBR = false;
      GridService.pointer.$selectedBox.next({
        top: `${Math.round(rect.startY / GridService.utility.aspectRatio)}`,
        left: `${Math.round(rect.startX / GridService.utility.aspectRatio)}`,
        width: `${Math.round(rect.w / GridService.utility.aspectRatio)}`,
        height: `${Math.round(rect.h / GridService.utility.aspectRatio)}`,
        page_index: `${GridService.pointer.currentPageIndex}`,
      });

      // rect.startX = 0;
      // rect.startY = 0;
      // rect.w = 0;
      // rect.h = 0;
      // ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    function mouseMove(e) {
      mouseX = e.pageX - this.offsetLeft - GridService.sidebarWidth;
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
      ctx.fillStyle = 'rgba(0, 0, 300, 0.2)';
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
  initAndResizeCanvas(
    gridCoords: Rect,
    cols: Record<string, Column>[],
    rows: Row[]
  ): void {
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
      GridService.cols = GridService.mapCols(cols);
      GridService.rows = GridService.mapRows(rows);
    }

    function updateCols(newCols: Column[]): Record<string, Column>[] {
      const retainedCols = newCols.map((col) => {
        return {
          [col.name]: {
            startX: col.startX,
          },
        };
      });
      GridService.pointer.$gridCols.next(retainedCols);
      return cols;
    }

    function updateRows(newRows: Row[]): void {
      GridService.pointer.$gridRows.next(newRows);
    }

    function mouseDown(e) {
      mouseX = e.pageX - this.offsetLeft - GridService.sidebarWidth;
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
        handleColResizing();
        handleRowResizing();
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
    }

    function handleColResizing() {
      for (let col of GridService.cols) {
        if (
          checkCloseEnough(mouseX, rect.startX + col.startX) &&
          checkCloseEnough(mouseY, rect.startY)
        ) {
          const draggedIndex = GridService.cols.findIndex(
            (item) => item.startX === col.startX
          );
          GridService.cols[draggedIndex].isDrag = true;
        }
      }
    }

    function handleRowResizing() {
      for (let row of GridService.rows) {
        if (
          checkCloseEnough(mouseX, rect.startX) &&
          checkCloseEnough(mouseY, rect.startY + row.startY)
        ) {
          const draggedIndex = GridService.rows.findIndex(
            (item) => item.startY === row.startY
          );
          GridService.rows[draggedIndex].isDrag = true;
        }
      }
    }

    function checkCloseEnough(p1, p2) {
      return Math.abs(p1 - p2) < closeEnough;
    }

    function updateGrid(cols: any) {
      const coordsBody = {
        'invoice-grid-coords': {
          width: rect.w / GridService.utility.aspectRatio,
          height: rect.h / GridService.utility.aspectRatio,
          'top-left-point': [
            rect.startY / GridService.utility.aspectRatio,
            rect.startX / GridService.utility.aspectRatio,
          ],
          'page-index': GridService.pointer.currentPageIndex,
        },
      };

      const colsBody = {
        'invoice-grid-cols': JSON.parse(JSON.stringify(cols)).map(
          (col: { [key: string]: any }) => {
            const colValue: { [key: string]: number } = Object.values(col)[0];
            const colKey: string = Object.keys(col)[0];
            colValue.startX = Math.round(
              colValue.startX / GridService.utility.aspectRatio
            );
            return {
              [colKey]: { startX: colValue.startX },
            };
          }
        ),
      };

      const rowsBody = {
        'invoice-grid-rows': JSON.parse(JSON.stringify(GridService.rows)).map(
          (row: { [key: string]: any }) => {
            row.startY = Math.round(
              row.startY / GridService.utility.aspectRatio
            );
            return {
              startY: row.startY,
            };
          }
        ),
      };
      GridService.pointer.gridBoxJson = JSON.stringify([
        coordsBody,
        colsBody,
        rowsBody,
      ]);
    }

    function mouseUp() {
      dragTL = dragTR = dragBL = dragBR = false;
      GridService.cols = GridService.cols.map((col) => {
        col.isDrag = false;
        return col;
      });

      GridService.rows = GridService.rows.map((col) => {
        col.isDrag = false;
        return col;
      });
      GridService.pointer.$gridCoords.next(rect);
      const newCols = updateCols(GridService.cols);
      updateRows(GridService.rows);
      updateGrid(newCols);
    }
    function mouseMove(e) {
      mouseX = e.pageX - this.offsetLeft - GridService.sidebarWidth;
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
      } else if (
        GridService.cols.findIndex((col) => col.isDrag === true) !== -1
      ) {
        const draggedIndex: number = GridService.cols.findIndex(
          (col) => col.isDrag === true
        );
        GridService.cols[draggedIndex].startX = mouseX - rect.startX;
      } else if (
        GridService.rows.findIndex((row) => row.isDrag === true) !== -1
      ) {
        const draggedIndex: number = GridService.rows.findIndex(
          (row) => row.isDrag === true
        );
        GridService.rows[draggedIndex].startY = mouseY - rect.startY;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw();
    }

    function drawAndMutateCols() {
      for (let col of GridService.cols) {
        ctx.beginPath();
        ctx.moveTo(rect.startX + col.startX, rect.startY);
        ctx.lineTo(rect.startX + col.startX, rect.startY + rect.h);
        ctx.stroke();
        drawColHandles(col);
      }
    }

    function drawAndMutateRows() {
      for (let row of GridService.rows) {
        ctx.beginPath();
        ctx.moveTo(rect.startX, rect.startY + row.startY);
        ctx.lineTo(rect.startX + rect.w, rect.startY + row.startY);
        ctx.stroke();
        drawRowHandles(row);
      }
    }

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 300, 0.2)';
      ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
      drawAndMutateCols();
      drawAndMutateRows();
      drawHandles();
    }
    function drawCircle(x, y, radius) {
      ctx.fillStyle = 'rgba(0, 0, 100, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    function drawColName(x, y, colName: string) {
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.beginPath();
      ctx.fillText(colName, x, y - 30);
      ctx.font = '16px Roboto';
      // ctx.arc(x, y, radius, 0, 2 * Math.PI);

      ctx.fill();
    }
    function drawHandles() {
      drawCircle(rect.startX, rect.startY, closeEnough);
      drawCircle(rect.startX + rect.w, rect.startY, closeEnough);
      drawCircle(rect.startX + rect.w, rect.startY + rect.h, closeEnough);
      drawCircle(rect.startX, rect.startY + rect.h, closeEnough);
    }

    // draw col indicator circle to make it editable
    function drawColHandles(col: Column) {
      drawCircle(rect.startX + col.startX, rect.startY, closeEnough);
      drawColName(rect.startX + col.startX, rect.startY, col.name);
    }

    function drawRowHandles(row: Row) {
      drawCircle(rect.startX, rect.startY + row.startY, closeEnough);
    }
    init();
  }
}
