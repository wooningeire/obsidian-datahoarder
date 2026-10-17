import { parseLinktext, type FrontMatterCache, type MetadataCache, type TFile } from "obsidian";

export type TaskFile = {
    file: TFile,
    frontmatter: FrontMatterCache,
};

export const findLeafTasks = (
    files: TFile[],
    metadataCache: MetadataCache,
) => {
    const tasks = files[Symbol.iterator]()
        .filter(file => file.extension === "md")
        .map(file => ({
            file,
            frontmatter: metadataCache.getFileCache(file)?.frontmatter ?? {},
        }))
        .toArray();
    const taskParents = new Map<TFile, TFile[]>(tasks.map(({file}) => [file, []]));
    const taskChildren = new Map<TFile, TFile[]>(tasks.map(({file}) => [file, []]));

    for (const { file, frontmatter } of tasks) {
        const parents: string[] = frontmatter["Parents"] ?? [];

        for (const link of parents) {
            const trimmedLink = link.trim();
            if (trimmedLink.length === 0) continue;

            const linktext = trimmedLink.replace(/^\[\[|\]\]$/g, "").split("|")[0] ?? "";
            const parent = metadataCache.getFirstLinkpathDest(
                parseLinktext(linktext).path,
                file.path,
            );
            if (parent === null) continue;

            taskParents.get(file)!.push(parent);
            taskChildren.get(parent)!.push(file);
        }
    }

    return {
        tasks,
        taskParents,
        taskChildren,
        leafTasks: tasks
            .filter(task => taskChildren.get(task.file)!.length === 0 && !["Done", "Dropped"].includes(task.frontmatter["Completion"])),
    }
};
