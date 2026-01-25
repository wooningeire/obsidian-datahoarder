import { SvelteMap } from "svelte/reactivity";
import type { DatahoarderDbOps, Table, Column } from "../dbOps/DatahoarderDbOps";
import { Notice } from "obsidian";

let tables = $state<Map<number, Table>>(new SvelteMap());
let enums = $state<Map<number, any>>(new SvelteMap());
let enumVariantsByEnumId = $state<Map<number, any>>(new SvelteMap());
let columnsByTable = $state<Record<number, Column[]>>({});
let rowsByTable = $state<Record<number, { id: number }[]>>({});
let cellsByRowByTable = $state<Record<number, Record<number, Record<number, string>>>>({});
let modified = $state(false);
let dbOps = $state<DatahoarderDbOps | null>(null);

export class Store {
    get tables() { return tables; }
    set tables(value: Map<number, Table>) { tables = value; }

    get enums() { return enums; }
    set enums(value: Map<number, any>) { enums = value; }

    get enumVariantsByEnumId() { return enumVariantsByEnumId; }
    set enumVariantsByEnumId(value: Map<number, any>) { enumVariantsByEnumId = value; }

    get columnsByTable() { return columnsByTable; }
    get rowsByTable() { return rowsByTable; }
    get cellsByRowByTable() { return cellsByRowByTable; }

    get modified() { return modified; }
    set modified(value: boolean) { modified = value; }

    get dbOps() { return dbOps; }
    set dbOps(value: DatahoarderDbOps | null) { dbOps = value; }

    refreshTables() {
        if (!dbOps) return;
        try {
            tables = dbOps.selectTables();
            for (const table of tables.values()) {
                this.refreshTableInfo(table.id);
            }
        } catch (error) {
            console.error("Failed to refresh tables:", error);
            new Notice("Failed to load tables: " + error);
        }
    }

    refreshTableInfo(tableId: number) {
        if (!dbOps) return;
        columnsByTable[tableId] = dbOps.selectColumns(tableId);
        rowsByTable[tableId] = dbOps.selectRows(tableId);
        
        const cells = dbOps.selectCells(tableId);
        const cellsByRow: Record<number, Record<number, string>> = {};
        for (const cell of cells) {
            const row: Record<number, string> = cellsByRow[cell.row_id] ?? {};
            row[cell.column_id] = cell.value;
            cellsByRow[cell.row_id] = row;
        }
        cellsByRowByTable[tableId] = cellsByRow;
    }

    refreshEnums() {
        if (!dbOps) return;
        try {
            enums = dbOps.selectEnums();

            const variants = new SvelteMap<number, any>();
            for (const enumItem of enums.values()) {
                variants.set(enumItem.id, dbOps.selectEnumVariants(enumItem.id));
            }
            enumVariantsByEnumId = variants;
        } catch (error) {
            console.error("Failed to refresh enums:", error);
            new Notice("Failed to load enums: " + error);
        }
    }

    async save() {
        if (!dbOps) return;
        await dbOps.save();
        modified = false;
    }

    createTable(label: string) {
        if (!dbOps || !label) return;
        try {
            dbOps.createTable(label);
            this.refreshTables();
            modified = true;
            new Notice("Table created");
        } catch (e) {
            console.error("Failed to create table:", e);
            new Notice("Failed to create table: " + e);
        }
    }

    updateTable({ tableId, label }: { tableId: number, label?: string }) {
        if (!dbOps) return;
        if (label) {
            dbOps.updateTableLabel(tableId, label);
        }
        this.refreshTables();
        modified = true;
    }

    deleteTable(tableId: number) {
        if (!dbOps) return;
        dbOps.deleteTable(tableId);
        this.refreshTables();
        modified = true;
    }

    addColumn({ tableId, label, datatype }: { tableId: number, label: string, datatype: string }) {
        if (!dbOps) return -1;
        const columnId = dbOps.addColumn(tableId, label, datatype);
        this.refreshTableInfo(tableId);
        modified = true;
        return columnId;
    }

    updateColumn({ columnId, label, datatype }: { columnId: number, label?: string, datatype?: string }) {
        if (!dbOps) return;
        if (label) {
            dbOps.updateColumnLabel(columnId, label);
        }
        if (datatype) {
            dbOps.updateColumnDatatype(columnId, datatype);
        }
        this.refreshTables();
        modified = true;
    }

    deleteColumn(columnId: number, tableId: number) {
        if (!dbOps) return;
        dbOps.deleteColumn(columnId);
        this.refreshTableInfo(tableId);
        modified = true;
    }

    reorderColumns(tableId: number, columnIds: number[]) {
        if (!dbOps) return;
        dbOps.reorderColumns(columnIds);
        this.refreshTableInfo(tableId);
        modified = true;
    }

    addRow(tableId: number) {
        if (!dbOps) return;
        dbOps.addRow(tableId);
        this.refreshTableInfo(tableId);
        modified = true;
    }

    deleteRow(rowId: number, tableId: number) {
        if (!dbOps) return;
        dbOps.deleteRow(rowId);
        this.refreshTableInfo(tableId);
        modified = true;
    }

    updateCell(rowId: number, columnId: number, value: string, tableId: number) {
        if (!dbOps) return;
        if (!cellsByRowByTable[tableId]) cellsByRowByTable[tableId] = {};
        if (!cellsByRowByTable[tableId][rowId]) cellsByRowByTable[tableId][rowId] = {};
        cellsByRowByTable[tableId][rowId][columnId] = value;
        
        dbOps.updateCell(rowId, columnId, value);
        modified = true;
    }

    createEnum(label: string) {
        if (!dbOps || !label) return;
        try {
            dbOps.createEnum(label);
            this.refreshEnums();
            modified = true;
            new Notice("Enum created");
        } catch (e) {
            console.error("Failed to create enum:", e);
            new Notice("Failed to create enum: " + e);
        }
    }

    updateEnum({ enumId, label }: { enumId: number, label?: string }) {
        if (!dbOps) return;
        if (label) {
            dbOps.updateEnumLabel(enumId, label);
        }
        this.refreshEnums();
        modified = true;
    }

    deleteEnum(enumId: number) {
        if (!dbOps) return;
        dbOps.deleteEnum(enumId);
        this.refreshEnums();
        modified = true;
    }

    addEnumVariant(enumId: number, label: string) {
        if (!dbOps) return -1;
        const variantId = dbOps.addEnumVariant(enumId, label);
        enumVariantsByEnumId.set(enumId, dbOps.selectEnumVariants(enumId));
        modified = true;
        return variantId;
    }

    updateEnumVariant(variantId: number, label: string) {
        if (!dbOps) return;
        dbOps.updateEnumVariantLabel(variantId, label);
        this.refreshEnums();
        modified = true;
    }

    deleteEnumVariant(variantId: number, enumId: number) {
        if (!dbOps) return;
        dbOps.deleteEnumVariant(variantId);
        enumVariantsByEnumId.set(enumId, dbOps.selectEnumVariants(enumId));
        modified = true;
    }

    reorderEnumVariants(enumId: number, variantIds: number[]) {
        if (!dbOps) return;
        dbOps.reorderEnumVariants(variantIds);
        enumVariantsByEnumId.set(enumId, dbOps.selectEnumVariants(enumId));
        modified = true;
    }
}

export const store = new Store();
