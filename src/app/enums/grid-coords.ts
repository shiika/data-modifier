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
