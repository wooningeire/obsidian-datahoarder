import type { HoardView } from "hoardview/HoardView";
import type { TFile } from "obsidian";
import { getContext, onMount, setContext } from "svelte";
import { findLeafTasks } from "./leafTasks";
import { PB_CONTEXT_KEY } from "../lib/datahoard/pbStore.svelte";
import type { Task, TimePeriod } from "../lib/pb";


const contextKey = Symbol("datahoarder store context");


type HoardViewOptions = {
    view: HoardView,
    files: TFile[] | null,
};

export class HoardViewStore {
    readonly view: HoardView;
    readonly files: TFile[];
    selectedTask: TFile | null = $state(null);
    taskGraph: ReturnType<typeof findLeafTasks> = $state()!;

    selectedPeriodId: string | null = $state(null);
    get pb() {
        return this.view.pbStore;
    }

    private constructor({
        view,
        files,
    }: HoardViewOptions) {
        this.view = view;
        this.files = files ?? [];

        this.taskGraph = this.computeTaskGraph();
    }

    static mount(options: HoardViewOptions) {
        const store = new HoardViewStore(options);

        onMount(() => {
            const metadataCache = store.view.app.metadataCache;
            const changedRef = metadataCache.on("changed", file => {
                store.taskGraph = store.computeTaskGraph();
            });
            const resolvedRef = metadataCache.on("resolved", () => {
                store.taskGraph = store.computeTaskGraph();
            });

            if (!store.pb.ready) {
                store.pb.run(() => store.pb.loadAll());
            }

            return () => {
                metadataCache.offref(changedRef);
                metadataCache.offref(resolvedRef);
            };
        });

        setContext(contextKey, store);
        setContext(PB_CONTEXT_KEY, store.pb);

        return store;
    }

    static use() {
        return getContext<HoardViewStore>(contextKey);
    }

    private computeTaskGraph() {
        return findLeafTasks(this.files, this.view.app.metadataCache);
    }

    //#region TODO needs review
    selectPeriod = (period: TimePeriod): void => {
        this.selectedPeriodId = period.id;
        this.selectedTask = this.fileForTask(period.task) ?? null;
    };

    taskId = (file: TFile): string | undefined => {
        const frontmatter = this.taskGraph.tasks.find(task => task.file === file)?.frontmatter;
        const sourceId: unknown = frontmatter?.["Source ID"];
        if (typeof sourceId === "string" && sourceId.trim().startsWith("pocketbase:")) {
            const id = sourceId.trim().slice("pocketbase:".length);
            if (id) return id;
        }
        const linkedId: unknown = frontmatter?.["PocketBase ID"];
        return typeof linkedId === "string" ? linkedId.trim() || undefined : undefined;
    };

    trackedTask = (file: TFile): Task | undefined => this.pb.tasks.find(task => task.id === this.taskId(file));

    fileForTask = (taskId: string): TFile | undefined => {
        return this.files.find(file => this.taskId(file) === taskId);
    };

    labelForTask = (taskId: string): string => {
        const file = this.fileForTask(taskId);
        if (file) return file.basename;

        const task = this.pb.tasks.find(task => task.id === taskId);
        return task?.label ?? (taskId ? "Missing task" : "Unassigned");
    };

    toggleClock = async (file: TFile): Promise<void> => {
        let taskId = this.taskId(file);
        if (taskId && this.files.filter(candidate => this.taskId(candidate) === taskId).length > 1) {
            throw new Error("Two notes link to the same PocketBase task. Give each note a unique PocketBase link before tracking time.");
        }

        if (!taskId) {
            const task = await this.pb.addTask(file.basename);
            if (!task) return;
            try {
                await this.view.app.fileManager.processFrontMatter(file, frontmatter => {
                    if (frontmatter["Source ID"]) frontmatter["PocketBase ID"] = task.id;
                    else frontmatter["Source ID"] = `pocketbase:${task.id}`;
                });
            } catch (error) {
                try {
                    await this.pb.deleteTask(task.id);
                } catch {
                    throw new Error(`Could not link the note or remove the new PocketBase task. Add PocketBase ID ${task.id} to the note before retrying.`);
                }
                throw error;
            }
            taskId = task.id;
        }
        await this.pb.toggleClock(taskId);
    };
    //#endregion
}
