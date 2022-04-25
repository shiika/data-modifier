export const GRID_COORDS = {
  width: 1310,
  height: 940,
};

export interface Rect {
  startX?: number;
  startY?: number;
  w?: number;
  h?: number;
}

export interface RectJson {
  width: number;
  height: number;
  'top-left-point': [number, number];
}
export interface Column {
  startX: number;
  isDrag: boolean;
  name: string;
}
export interface Row {
  startY: number;
  isDrag: boolean;
}

export type ColsJson = Record<string, Column>;
export type GridJsonData = RectJson | ColsJson;
