import type { App, PluginManifest } from "obsidian";
import type { Database } from "sql.js";

export class DatahoarderDbOps {
    constructor(
        private app: App,
        private manifest: PluginManifest,
        private db: Database,
    ) {}

    async setUpSchema() {
        await this.db.exec(await this.app.vault.adapter.read(`./${this.manifest.dir}/schema.sql`));
    }

    async save() {
        const data = this.db.export();
        await this.app.vault.adapter.writeBinary("./.datahoarder/db.sqlite", new Uint8Array(data).buffer);
    }

    selectTables() {
        const results = this.db.exec("SELECT id, label FROM Tables")[0]?.values ?? [];
        return results.map(result => ({
            id: result[0],
            label: result[1],
        }));
    }
}