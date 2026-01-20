import type { App, PluginManifest } from "obsidian";
import type { Database } from "sql.js";
import { Notice } from "obsidian";

export class DatahoarderDbOps {
    constructor(
        private app: App,
        private manifest: PluginManifest,
        private db: Database,
    ) {}

    async setUpSchema() {
        try {
            this.db.exec(await this.app.vault.adapter.read(`./${this.manifest.dir}/src/dbOps/schema.sql`));
            new Notice("Schema set up successfully");
        } catch (e) {
            new Notice("Failed to set up schema: " + e);
        }
    }

    async migrate() {
        try {
            this.db.exec(await this.app.vault.adapter.read(`./${this.manifest.dir}/src/dbOps/migrate.sql`));
            new Notice("Migration successful");
        } catch (e) {
            new Notice("Failed to migrate: " + e);
        }
    }

    async save() {
        const data = this.db.export();
        await this.app.vault.adapter.writeBinary("./.datahoarder/db.sqlite", new Uint8Array(data).buffer);
    }

    private getLastInsertId(): number {
        const results = this.db.exec("SELECT last_insert_rowid()");
        const id = results[0]?.values[0]?.[0];
        if (typeof id === 'number') return id;
        throw new Error("Failed to retrieve last insert ID");
    }

    createTable(label: string) {
        this.db.run("INSERT INTO Tables (label) VALUES (?)", [label]);
        return this.getLastInsertId();
    }

    updateTableLabel(tableId: number, label: string) {
        this.db.run("UPDATE Tables SET label = ? WHERE id = ?", [label, tableId]);
    }

    addColumn(tableId: number, label: string, datatype: string) {
        const maxOrderResult = this.db.exec(
            "SELECT COALESCE(MAX(default_sort_order), -1) + 1 FROM Columns WHERE table_id = ?",
            [tableId]
        );
        const nextOrder = (maxOrderResult[0]?.values[0]?.[0] as number) ?? 0;
        
        this.db.run(
            "INSERT INTO Columns (table_id, label, datatype, default_sort_order) VALUES (?, ?, ?, ?)",
            [tableId, label, datatype, nextOrder]
        );
        return this.getLastInsertId();
    }

    updateColumnLabel(columnId: number, label: string) {
        this.db.run("UPDATE Columns SET label = ? WHERE id = ?", [label, columnId]);
    }

    updateColumnDatatype(columnId: number, datatype: string) {
        this.db.run("UPDATE Columns SET datatype = ? WHERE id = ?", [datatype, columnId]);
    }

    reorderColumns(columnIds: number[]) {
        for (let i = 0; i < columnIds.length; i++) {
            const columnId = columnIds[i];
            if (columnId !== undefined) {
                this.db.run("UPDATE Columns SET default_sort_order = ? WHERE id = ?", [i, columnId]);
            }
        }
    }

    addRow(tableId: number) {
        this.db.run("INSERT INTO Rows (table_id) VALUES (?)", [tableId]);
        return this.getLastInsertId();
    }

    updateCell(rowId: number, columnId: number, value: string) {
        this.db.run(
            "INSERT OR REPLACE INTO Cells (row_id, column_id, value) VALUES (?, ?, ?)",
            [rowId, columnId, value]
        );
    }

    selectTables() {
        const results = this.db.exec("SELECT id, label FROM Tables")[0]?.values ?? [];
        return new Map(
            results.map(result => [result[0] as number, {
                id: result[0] as number,
                label: result[1] as string,
            }])
        );
    }

    selectColumns(tableId: number) {
        const results = this.db.exec(
            "SELECT id, label, datatype FROM Columns WHERE table_id = ? ORDER BY default_sort_order ASC, id ASC",
            [tableId]
        )[0]?.values ?? [];
        return results.map(result => ({
            id: result[0] as number,
            label: result[1] as string,
            datatype: result[2] as string,
        }));
    }

    selectRows(tableId: number) {
        const results = this.db.exec("SELECT id FROM Rows WHERE table_id = ?", [tableId])[0]?.values ?? [];
        return results.map(result => ({
            id: result[0] as number,
        }));
    }

    selectCells(tableId: number) {
        const results = this.db.exec(
            "SELECT row_id, column_id, value FROM Cells JOIN Rows ON Cells.row_id = Rows.id WHERE Rows.table_id = ?", 
            [tableId]
        )[0]?.values ?? [];
        
        return results.map(result => ({
            row_id: result[0] as number,
            column_id: result[1] as number,
            value: result[2] as string,
        }));
    }

    // --- Enum Operations ---

    createEnum(label: string) {
        this.db.run("INSERT INTO Enums (label) VALUES (?)", [label]);
        return this.getLastInsertId();
    }

    selectEnums() {
        const results = this.db.exec("SELECT id, label FROM Enums")[0]?.values ?? [];
        return new Map(
            results.map(result => [result[0] as number, {
                id: result[0] as number,
                label: result[1] as string,
            }])
        );
    }

    updateEnumLabel(enumId: number, label: string) {
        this.db.run("UPDATE Enums SET label = ? WHERE id = ?", [label, enumId]);
    }

    addEnumVariant(enumId: number, label: string) {
        const maxOrderResult = this.db.exec(
            "SELECT COALESCE(MAX(default_sort_order), -1) + 1 FROM EnumVariants WHERE enum_id = ?",
            [enumId]
        );
        const nextOrder = (maxOrderResult[0]?.values[0]?.[0] as number) ?? 0;
        
        this.db.run(
            "INSERT INTO EnumVariants (enum_id, label, default_sort_order) VALUES (?, ?, ?)",
            [enumId, label, nextOrder]
        );
        return this.getLastInsertId();
    }

    selectEnumVariants(enumId: number) {
        const results = this.db.exec(
            "SELECT id, label FROM EnumVariants WHERE enum_id = ? ORDER BY default_sort_order ASC, id ASC",
            [enumId]
        )[0]?.values ?? [];
        return results.map(result => ({
            id: result[0] as number,
            label: result[1] as string,
        }));
    }

    reorderEnumVariants(variantIds: number[]) {
        for (let i = 0; i < variantIds.length; i++) {
            const variantId = variantIds[i];
            if (variantId !== undefined) {
                this.db.run("UPDATE EnumVariants SET default_sort_order = ? WHERE id = ?", [i, variantId]);
            }
        }
    }

    updateEnumVariantLabel(variantId: number, label: string) {
        this.db.run("UPDATE EnumVariants SET label = ? WHERE id = ?", [label, variantId]);
    }
}

export type Table = {
    id: number;
    label: string;
};

export type Column = {
    id: number;
    label: string;
    datatype: string;
};