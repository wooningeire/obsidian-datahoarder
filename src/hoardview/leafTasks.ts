import { parseLinktext, type FrontMatterCache, type MetadataCache, type TFile } from "obsidian";

export type TaskFile = {
    file: TFile,
    frontmatter: FrontMatterCache,
};

export const findLeafTasks = (
    files: TFile[],
    metadataCache: MetadataCache,
): TaskFile[] => {
    const tasks = files[Symbol.iterator]()
        .filter(file => file.extension === "md")
        .map(file => ({
            file,
            frontmatter: metadataCache.getFileCache(file)?.frontmatter ?? {},
        }))
        .toArray();
    const parentPaths = new Set<string>();

    for (const { file, frontmatter } of tasks) {
        const parents: string = frontmatter["Parents"] ?? "";

        for (const link of parents) {
            const trimmedLink = link.trim();
            if (trimmedLink.length === 0) continue;

            const linktext = trimmedLink.replace(/^\[\[|\]\]$/g, "").split("|")[0] ?? "";
            const parent = metadataCache.getFirstLinkpathDest(
                parseLinktext(linktext).path,
                file.path,
            );
            if (parent === null) continue;

            parentPaths.add(parent.path);
        }
    }

    return tasks
        .filter(task => !parentPaths.has(task.file.path) && !["Done", "Dropped"].includes(task.frontmatter["Completion"]));
};
