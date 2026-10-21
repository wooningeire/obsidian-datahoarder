import { parse } from "json5";
import type { CollectionView } from "../collections/collection";


const isCollectionView = (value: unknown): value is CollectionView => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;

    
    const view = value as Record<string, unknown>;

    return typeof view.name === "string"
        && typeof view.type === "string"
        && ["table", "cards", "list", "calendar"].includes(view.type)
        && (view.columns === undefined || (
            Array.isArray(view.columns) && view.columns.every(column => typeof column === "string")
        ))
        && ["filter", "sortColumn"].every(key => (
            view[key] === undefined || typeof view[key] === "string"
        ))
        && (view.sortDirection === undefined || view.sortDirection === "asc" || view.sortDirection === "desc")
        && (view.leafOnly === undefined || typeof view.leafOnly === "boolean");
};


export const parseViews = (data: string): CollectionView[] => {
    if (data.trim().length === 0) return [];

    const views = parse<unknown>(data);
    if (!Array.isArray(views) || !views.every(isCollectionView)) {
        throw new TypeError("invalid hoardview configuration");
    }

    return views;
};
