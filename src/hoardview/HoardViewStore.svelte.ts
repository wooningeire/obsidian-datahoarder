import type { HoardView } from "hoardview/HoardView";
import type { TFile } from "obsidian";
import { getContext, onMount, setContext } from "svelte";
import { findLeafTasks } from "./leafTasks";


const contextKey = Symbol("datahoarder store context");

export class HoardViewStore {
    readonly view: HoardView;
    readonly files: TFile[];
    selectedTask: TFile | null = $state(null);
    taskGraph: ReturnType<typeof findLeafTasks> = $state()!;

    private constructor({
        view,
        files,
    }: {
        view: HoardView,
        files: TFile[] | null,
    }) {
        this.view = view;
        this.files = files ?? [];

        this.taskGraph = this.computeTaskGraph();
    }

    static mount({
        view,
        files,
    }: {
        view: HoardView,
        files: TFile[] | null,
    }) {
        const store = new HoardViewStore({
            view,
            files,
        });

        onMount(() => {
            const metadataCache = store.view.app.metadataCache;
            const changedRef = metadataCache.on("changed", file => {
                store.taskGraph = store.computeTaskGraph();
            });
            const resolvedRef = metadataCache.on("resolved", () => {
                store.taskGraph = store.computeTaskGraph();
            });

            return () => {
                metadataCache.offref(changedRef);
                metadataCache.offref(resolvedRef);
            };
        });

        setContext(contextKey, store);

        return store;
    }

    static use() {
        return getContext<HoardViewStore>(contextKey);
    }

    private computeTaskGraph() {
        return findLeafTasks(this.files, this.view.app.metadataCache);
    }
}