export interface Point {
  height: number;
  width: number;
  'page-index': number;
  word: string;
  'top-left-point': number[];
}

export interface Objective {
  [key: string]: Point[];
}
