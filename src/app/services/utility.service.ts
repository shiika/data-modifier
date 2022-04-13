import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root"
})

export class UtilityService {
    extractValue(property: string): number {
        const numericValue = parseInt(property.split("px")[0]);
        return numericValue
    }
}