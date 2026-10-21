import { getContext, onMount, setContext } from "svelte";
import type { PaneType } from "obsidian";
import type { HoardView } from "./HoardView";
import { PB_CONTEXT_KEY } from "../lib/datahoard/pbStore.svelte";
import type { Task, TimePeriod } from "../lib/pb";
import { createTaskGraph } from "./taskGraph";
import type { CollectionView } from "../collections/collection";
import { selectTasks, taskValue } from "../collections/tasks";
import { parseViews } from "./viewConfig";


const contextKey = Symbol("datahoarder store context");


export class HoardViewStore {
    readonly view: HoardView;

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


    constructor(view: HoardView) {
        this.view = view;
    }


    static mount(view: HoardView) {
        const store = view.store;

        setContext(contextKey, store);
        setContext(PB_CONTEXT_KEY, store.pb);

        onMount(() => {
            void store.pb.run(() => store.pb.loadAll());
        });

        return store;
    }

    static use() {
        return getContext<HoardViewStore>(contextKey);
    }


    setViewData = (data: string, clear: boolean): void => {
        if (clear) this.clear();

        try {
            this.views = parseViews(data);
            this.error = "";
        } catch (error) {
            this.views = [];
            this.error = error instanceof Error ? error.message : String(error);
        }
        if (this.viewIndex >= this.views.length) this.viewIndex = 0;
    };

    clear = (): void => {
        this.views = [];
        this.error = "";
        this.viewIndex = 0;
        this.selectedTaskId = null;
        this.selectedPeriodId = null;
    };


    valueForTask = (task: Task, column: string): string => {
        const value = taskValue(task, column, this.pb);
        return Array.isArray(value) ? value.join(", ") : String(value ?? "");
    };

    selectTask = (taskId: string): void => {
        this.selectedTaskId = this.pb.tasksById.has(taskId) ? taskId : null;
        this.selectedPeriodId = null;
    };

    selectPeriod = (period: TimePeriod): void => {
        this.selectedTaskId = this.pb.tasksById.has(period.task) ? period.task : null;
        this.selectedPeriodId = period.id;
    };

    createTask = async (label: string): Promise<void> => {
        const task = await this.pb.addTask(label);
        this.selectTask(task.id);
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
