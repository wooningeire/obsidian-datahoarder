import type { Table } from "./dbOps/DatahoarderDbOps";

let tables = $state(new Map<number, Table>());
let enums = $state(new Map<number, any>());

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
}

export const store = new Store();
