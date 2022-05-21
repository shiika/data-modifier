import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Objective, Point } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private host: string = 'http://65.108.211.133';
  isActive: boolean = false;

  $allPoints: Point[];
  $objectives: Objective[];
  images: string[];

  get allPoints(): Point[] {
    return this.$allPoints;
  }

  set allPoints(points: Point[]) {
    this.$allPoints = points;
  }

  get objectives(): Objective[] {
    return this.$objectives;
  }

  set objectives(points: Objective[]) {
    this.$objectives = points;
  }

  constructor(private http: HttpClient) {}

  upload(body: any): Observable<any> {
    return this.http.post(`${this.host}/uploader`, body);
  }

  getSelectedPoint(body: any): Observable<any> {
    return this.http.post(`${this.host}/selection-box`, body, {
      responseType: 'text',
    });
  }

  updateGrid(body: any): Observable<any> {
    return this.http.post(`${this.host}/edit-grid`, body, {
      responseType: 'text',
    });
  }
}
