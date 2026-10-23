import { getContext, onMount, setContext } from "svelte";
import type { PaneType } from "obsidian";
import type { Hoardview } from "./Hoardview";
import { PB_CONTEXT_KEY } from "../lib/datahoard/pbStore.svelte";
import type { Task, TimePeriod } from "../lib/pb";
import { createTaskGraph } from "./task/taskGraph";
import type { CollectionView, derived } from "../collections/collection";
import { selectTasks, taskValue } from "../collections/tasks";
import { serveVaultModule } from "./serveVaultModule";


const contextKey = Symbol("datahoarder store context");


type HoardCollection = (params: {
    derived: typeof derived,
}) => CollectionView;

export class HoardViewStore {
    readonly view: Hoardview;

    source = $state<HoardCollection | null>(null);
    views = $state<CollectionView[]>([]);
    error = $state("");
    viewIndex = $state(0);
    selectedTaskId = $state<string | null>(null);
    selectedPeriodId = $state<string | null>(null);

    taskGraph = $derived(createTaskGraph(this.pb.tasks, this.pb.completions));
    collectionView = $derived(this.views[this.viewIndex] ?? null);
    visibleTasks = $derived(this.collectionView ? selectTasks(
        this.collectionView.leafOnly ? this.taskGraph.leafTasks : this.pb.tasks,
        this.collectionView,
        this.pb,
    ) : []);
    visiblePeriods = $derived.by(() => {
        const ids = new Set(this.visibleTasks.map(task => task.id));
        return this.pb.timePeriods.filter(period => (
            !this.pb.tasksById.has(period.task) || ids.has(period.task)
        ));
    });
    selectedTask = $derived(this.pb.tasksById.get(this.selectedTaskId ?? "") ?? null);
    selectedPeriod = $derived(this.pb.timePeriods.find(period => (
        period.id === this.selectedPeriodId
    )) ?? null);

    get pb() {
        return this.view.pbStore;
    }


    constructor(view: Hoardview) {
        this.view = view;
    }


    static mount(view: Hoardview) {
        const store = view.store;

        setContext(contextKey, store);
        setContext(PB_CONTEXT_KEY, store.pb);

        onMount(() => {
            store.pb.run(() => store.pb.loadAll());
        });

        return store;
    }

    static use() {
        return getContext<HoardViewStore>(contextKey);
    }


    async setFileContents(data: string) {
        let close: (() => void) | undefined;

        try {
            const module = await serveVaultModule(
                this.view.app.vault.adapter,
                this.view.file?.path ?? "",
                data,
            );
            close = module.close;

            const {
                source,
                views,
            }: {
                source: HoardCollection,
                views: CollectionView[],
            } = await import(module.url);

            this.source = source;
            this.views = views;

            this.error = "";
        } catch (error) {
            this.source = null;
            this.views = [];

            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            close?.();
        }
        
        if (this.viewIndex >= this.views.length) {
            this.viewIndex = 0;
        }
    }

    clear() {
        this.source = null;
        this.views = [];
        this.error = "";
        this.viewIndex = 0;
        this.selectedTaskId = null;
        this.selectedPeriodId = null;
    }


    valueForTask = (task: Partial<Task>, column: string): string => {
        const value = taskValue(task, column, this.pb);
        return Array.isArray(value) ? value.join(", ") : String(value ?? "");
    };


    openTaskDetails(taskId: string) {
        this.selectedTaskId = this.pb.tasksById.has(taskId) ? taskId : null;
        this.selectedPeriodId = null;
    }

    selectPeriod = (period: TimePeriod): void => {
        this.selectedTaskId = this.pb.tasksById.has(period.task) ? period.task : null;
        this.selectedPeriodId = period.id;
    };

    createTask = async (fields: Partial<Task>): Promise<void> => {
        const task = await this.pb.addTask(fields);
    };

    labelForTask = (taskId: string): string => {
        return this.pb.tasksById.get(taskId)?.label || (taskId ? "Missing task" : "Unassigned");
    };

    openNote = async (taskId: string, newLeaf: PaneType | boolean): Promise<void> => {
        const task = this.pb.tasksById.get(taskId);
        const file = task?.note_path
            ? this.view.app.vault.getFileByPath(task.note_path)
            : null;

        if (file) await this.view.app.workspace.getLeaf(newLeaf).openFile(file);
    };
}
