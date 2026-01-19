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

    async save() {
        const data = this.db.export();
        await this.app.vault.adapter.writeBinary("./.datahoarder/db.sqlite", new Uint8Array(data).buffer);
    }

    private getLastInsertId(): number {
        const results = this.db.exec("SELECT last_insert_rowid()");
        const id = results[0]?.values[0][0];
        if (typeof id === 'number') return id;
        throw new Error("Failed to retrieve last insert ID");
    }

    createTable(label: string) {
        this.db.run("INSERT INTO Tables (label) VALUES (?)", [label]);
        return this.getLastInsertId();
    }

    addColumn(tableId: number, label: string, datatype: string) {
        this.db.run("INSERT INTO Columns (table_id, label, datatype) VALUES (?, ?, ?)", [tableId, label, datatype]);
        return this.getLastInsertId();
    }

    updateColumnLabel(columnId: number, label: string) {
        this.db.run("UPDATE Columns SET label = ? WHERE id = ?", [label, columnId]);
    }

    updateColumnDatatype(columnId: number, datatype: string) {
        this.db.run("UPDATE Columns SET datatype = ? WHERE id = ?", [datatype, columnId]);
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
        return results.map(result => ({
            id: result[0] as number,
            label: result[1] as string,
        }));
    }

    selectColumns(tableId: number) {
        const results = this.db.exec("SELECT id, label, datatype FROM Columns WHERE table_id = ?", [tableId])[0]?.values ?? [];
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
        return results.map(result => ({
            id: result[0] as number,
            label: result[1] as string,
        }));
    }

    updateEnumLabel(enumId: number, label: string) {
        this.db.run("UPDATE Enums SET label = ? WHERE id = ?", [label, enumId]);
    }

    addEnumVariant(enumId: number, label: string) {
        this.db.run("INSERT INTO EnumVariants (enum_id, label) VALUES (?, ?)", [enumId, label]);
        return this.getLastInsertId();
    }

    selectEnumVariants(enumId: number) {
        const results = this.db.exec("SELECT id, label FROM EnumVariants WHERE enum_id = ?", [enumId])[0]?.values ?? [];
        return results.map(result => ({
            id: result[0] as number,
            label: result[1] as string,
        }));
    }

    updateEnumVariantLabel(variantId: number, label: string) {
        this.db.run("UPDATE EnumVariants SET label = ? WHERE id = ?", [label, variantId]);
    }
}