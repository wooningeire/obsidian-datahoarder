import type { HoardView } from "HoardView";
import { getContext, setContext } from "svelte";


const contextKey = Symbol("datahoarder store context");

export class HoardViewStore {
    readonly view: HoardView;

    private constructor({
        view,
    }: {
        view: HoardView,
    }) {
        this.view = view;
    }

    static mount({
        view,
    }: {
        view: HoardView,
    }) {
        const store = new HoardViewStore({
            view,
        });

        setContext(contextKey, store);
    }

    static use() {
        return getContext<HoardViewStore>(contextKey);
    }
}