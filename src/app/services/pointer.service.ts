import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class PointerService {
    $itemPointEmitter: Subject<number> = new Subject<number>();

    constructor() {}
}