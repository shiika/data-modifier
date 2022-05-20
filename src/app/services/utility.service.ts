import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  $images: BehaviorSubject<File[]> = new BehaviorSubject<File[]>([]);
  aspectRatio: number;
  extractValue(property: string): number {
    const numericValue = parseInt(property.split('px')[0]);
    return numericValue;
  }
}
