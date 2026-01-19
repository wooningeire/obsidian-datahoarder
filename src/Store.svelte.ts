import { SvelteMap } from "svelte/reactivity";
import type { Table } from "./dbOps/DatahoarderDbOps";

let tables = $state<Map<number, Table>>(new SvelteMap());
let enums = $state<Map<number, any>>(new SvelteMap());
let enumVariantsByEnumId = $state<Map<number, any>>(new SvelteMap());

export class Store {
    // tables = $state(new Map<number, Table>());
    // enums = $state(new Map<number, any>());

    get tables() {
        return tables;
    }
    set tables(value: Map<number, Table>) {
        tables = value;
    }

    get enums() {
        return enums;
    }
    set enums(value: Map<number, any>) {
        enums = value;
    }

    get enumVariantsByEnumId() {
        return enumVariantsByEnumId;
    }
    set enumVariantsByEnumId(value: Map<number, any>) {
        enumVariantsByEnumId = value;
    }
}

export const store = new Store();
