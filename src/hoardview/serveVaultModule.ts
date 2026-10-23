import { Platform, type DataAdapter } from "obsidian";
import {createServer} from "http";


export const serveVaultModule = async (
    adapter: Pick<DataAdapter, "read">,
    path: string,
    data: string,
) => {
    if (!Platform.isDesktopApp) throw new Error("Vault module imports require desktop Obsidian.");

    const pathnamePrefix = `/${crypto.randomUUID()}/`;
    const server = createServer(async (request, response) => {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Cache-Control", "no-store");

        try {
            const url = new URL(request.url ?? "", "http://127.0.0.1");
            if (!url.pathname.startsWith(pathnamePrefix)) {
                response.writeHead(404).end();
                return;
            }

            const modulePath = decodeURIComponent(url.pathname.slice(pathnamePrefix.length));
            if (
                modulePath.startsWith("/")
                || modulePath.includes("\\")
                || modulePath.includes(":")
                || modulePath.split("/").some(part => part === "..")
            ) {
                response.writeHead(404).end();
                return;
            }

            const source = modulePath === path ? data : await adapter.read(modulePath);
            response.setHeader("Content-Type", "text/javascript; charset=utf-8");
            response.end(source);
        } catch {
            response.writeHead(404).end();
        }
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
        server.close();
        throw new Error("Could not start the vault module server.");
    }

    return {
        url: `http://127.0.0.1:${address.port}${pathnamePrefix}${path.split("/").map(encodeURIComponent).join("/")}`,
        close: () => {
            server.close();
            server.closeAllConnections();
        },
    };
};
