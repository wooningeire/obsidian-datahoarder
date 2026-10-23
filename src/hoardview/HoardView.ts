import { TextFileView, type TFile, type WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import HoardViewFileView from "./HoardViewFileView.svelte";
import { HoardViewStore } from "./HoardViewStore.svelte";
import type { PbStore } from "../lib/datahoard/pbStore.svelte";

export const VIEW_TYPE_HOARD = "hoard-view";

export class HoardView extends TextFileView {
    private component: ReturnType<typeof mount> | null = null;
    readonly store = new HoardViewStore(this);


    constructor(
        leaf: WorkspaceLeaf,
        readonly pbStore: PbStore,
    ) {
        super(leaf);
    }

    getViewType() {
        return VIEW_TYPE_HOARD;
    }

    getDisplayText() {
        return this.file ? this.file.basename : "Hoard View";
    }

    async onLoadFile(file: TFile) {
        if (this.component !== null) {
            await unmount(this.component);
            this.component = null;
        }

        await super.onLoadFile(file);

        this.component = mount(HoardViewFileView, {
            target: this.contentEl,
            props: {
                view: this,
            },
        });
    }

    async onClose() {
        if (this.component === null) return;
        await unmount(this.component);
        this.component = null;
    }

    getViewData(): string {
        return this.data;
    }

    async setViewData(data: string, clear: boolean) {
        this.data = data;

        if (clear) {
            this.store.clear();
        }
        
        await this.store.setFileContents(data);
    }

    clear(): void {
        this.data = "";
        this.store.clear();
    }
}
