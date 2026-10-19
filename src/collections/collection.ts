import type { Task } from "../lib/pb";


type CollectionContext = {
    record: Task,
    value: (column: string) => unknown,
};

type CollectionField = {
    type: string,
    derive?: (context: CollectionContext) => unknown,
};

export type CollectionView = {
    name: string,
    type: "table" | "cards" | "list" | "calendar",
    columns?: string[],
    filter?: string,
    sortColumn?: string,
    sortDirection?: "asc" | "desc",
    leafOnly?: boolean,
};

type CollectionDefinition = {
    name: string,
    source: { type: "pocketbase", collection: "tasks" },
    schema: Record<string, string | CollectionField>,
    views: CollectionView[],
};


export const collection = (definition: CollectionDefinition): CollectionDefinition => definition;

export const derived = (
    derive: NonNullable<CollectionField["derive"]>,
    options: { type?: string } = {},
): CollectionField => ({ type: options.type ?? "computed", derive });
