import { App, PluginManifest } from "obsidian";
import initSqlJs, { Database, SqlJsStatic } from "sql.js";

export const createSqljs = async (app: App, manifest: PluginManifest) => {
    const sqljsWasmPath = `${manifest.dir}/sql-wasm.wasm`;
    const sqljsWasmBinary = await app.vault.adapter.readBinary(sqljsWasmPath);
    
    return await initSqlJs({
        wasmBinary: sqljsWasmBinary,
    });
};