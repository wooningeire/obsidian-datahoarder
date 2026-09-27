import type { BasesEntryGroup, BasesQueryResult, BasesView } from "obsidian";

export class DatahoardBaseViewState {
    groups: BasesEntryGroup[] = $state([]);
}