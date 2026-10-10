import { parseLinktext, type FrontMatterCache, type MetadataCache, type TFile } from "obsidian";

export type TaskFile = {
    file: TFile,
    frontmatter: FrontMatterCache,
};

export const getLeafTasks = (
    files: TFile[],
    metadataCache: Pick<MetadataCache, "getFileCache" | "getFirstLinkpathDest">,
): TaskFile[] => {
    const tasks = files
        .filter(file => file.extension === "md")
        .map(file => ({
            file,
            frontmatter: metadataCache.getFileCache(file)?.frontmatter ?? {},
        }));
    const parentPaths = new Set<string>();

    for (const { file, frontmatter } of tasks) {
        const parents: unknown = frontmatter.Parents;
        const links = Array.isArray(parents) ? parents : [parents];

        for (const link of links) {
            if (typeof link !== "string" || !link.trim()) continue;

            const linktext = link.trim().replace(/^\[\[|\]\]$/g, "").split("|")[0] ?? "";
            const parent = metadataCache.getFirstLinkpathDest(
                parseLinktext(linktext).path,
                file.path,
            );
            if (parent) parentPaths.add(parent.path);
        }
    }

    return tasks.filter(({ file }) => !parentPaths.has(file.path));
};
