//#region TODO needs review

import type { ChildProcess } from "child_process";

type PocketBaseServerOptions = {
    apiUrl: string,
    vaultPath: string,
    directory: string,
    executablePath: string,
    onError: (message: string) => void,
};

export class PocketBaseServer {
    private child: ChildProcess | null = null;
    private starting: Promise<void> | null = null;
    private closed = false;

    constructor(private options: PocketBaseServerOptions) {}

    ensureStarted = (): Promise<void> => {
        if (this.closed) return Promise.reject(new Error("PocketBase startup was cancelled."));
        if (this.starting) return this.starting;
        this.starting = this.start().finally(() => { this.starting = null; });
        return this.starting;
    };

    stop = (): void => {
        this.closed = true;
        this.child?.kill();
    };

    private healthy = async (apiUrl: URL): Promise<boolean> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        try {
            const response = await fetch(`${apiUrl.href.replace(/\/+$/, "")}/health`, {
                signal: controller.signal,
            });
            const health = response.ok ? await response.json() : null;
            return health?.code === 200;
        } catch {
            return false;
        } finally {
            clearTimeout(timeout);
        }
    };

    private start = async (): Promise<void> => {
        const url = new URL(this.options.apiUrl);
        if (
            url.protocol !== "http:"
            || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
            || url.pathname.replace(/\/+$/, "") !== "/api"
            || url.username || url.password || url.search || url.hash
        ) {
            throw new Error("PocketBase auto-start requires a local HTTP URL, such as http://127.0.0.1:8090/api.");
        }
        const healthy = await this.healthy(url);
        if (this.closed) throw new Error("PocketBase startup was cancelled.");
        if (healthy) return;
        if (this.child) throw new Error("PocketBase is running but not responding. Wait a moment, then retry.");

        // Obsidian exposes Node through require; import() uses Chromium's module resolver.
        // Keep these loads inside desktop startup so the API client still works on mobile.
        const { spawn } = require("child_process") as typeof import("child_process");
        const { resolve, relative, isAbsolute, join, sep } = require("path") as typeof import("path");
        const { realpath } = require("fs/promises") as typeof import("fs/promises");
        const vaultPath = await realpath(this.options.vaultPath);
        const vaultFile = async (value: string): Promise<string> => {
            const resolved = await realpath(resolve(vaultPath, value));
            const rel = relative(vaultPath, resolved);
            if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
                throw new Error("PocketBase paths must stay inside the vault.");
            }
            return resolved;
        };

        let directory: string;
        let executable: string;
        try {
            directory = await vaultFile(this.options.directory);
            executable = await vaultFile(this.options.executablePath || join(
                this.options.directory,
                process.platform === "win32" ? "pocketbase.exe" : "pocketbase",
            ));
            await vaultFile(join(directory, "pb_data", "data.db"));
        } catch (error) {
            throw new Error(`Check the PocketBase executable and folder containing pb_data/data.db. ${error instanceof Error ? error.message : error}`);
        }
        if (this.closed) throw new Error("PocketBase startup was cancelled.");

        let failure = "";
        let output = "";
        let ready = false;
        let child: ChildProcess;
        try {
            child = spawn(executable, [
                "serve",
                `--http=${url.host}`,
                `--dir=${join(directory, "pb_data")}`,
                `--migrationsDir=${join(directory, "pb_migrations")}`,
                `--hooksDir=${join(directory, "pb_hooks")}`,
            ], {
                cwd: directory,
                windowsHide: true,
                shell: false,
                stdio: ["ignore", "ignore", "pipe"],
            });
        } catch (error) {
            throw new Error(`Could not launch PocketBase: ${error instanceof Error ? error.message : error}`);
        }
        this.child = child;
        child.stderr?.on("data", (data: Buffer) => { output = (output + data.toString()).slice(-2000); });
        child.once("error", error => {
            if (this.child === child) this.child = null;
            failure = `Could not launch PocketBase: ${error.message}`;
        });
        child.once("exit", (code, signal) => {
            if (this.child === child) this.child = null;
            failure = `PocketBase stopped (${signal ?? code}). ${output}`.trim();
            if (ready && !this.closed) this.options.onError(failure);
        });

        try {
            const deadline = Date.now() + 10000;
            while (Date.now() < deadline) {
                if (this.closed) throw new Error("PocketBase startup was cancelled.");
                if (failure) throw new Error(failure);
                if (await this.healthy(url)) {
                    if (this.closed) throw new Error("PocketBase startup was cancelled.");
                    if (failure) throw new Error(failure);
                    ready = true;
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 150));
            }
            throw new Error(`PocketBase did not become ready within 10 seconds. ${output}`.trim());
        } catch (error) {
            child.kill();
            throw error;
        }
    };
}

// #endregion
