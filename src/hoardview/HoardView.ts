import { TextFileView, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import HoardViewFileView from './HoardViewFileView.svelte';
import type { PbStore } from "../lib/datahoard/pbStore.svelte";

export const VIEW_TYPE_HOARD = 'hoard-view';

export class HoardView extends TextFileView {
    private component: ReturnType<typeof mount> | null = null;


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
        return this.file ? this.file.basename : 'Hoard View';
    }

    async onLoadFile(file: TFile) {
        if (this.component !== null) {
            await unmount(this.component);
        }

        const dataFolder = file.parent?.children.find(child => child.name === "Data" && child instanceof TFolder) as TFolder | undefined ?? null;
        const files = dataFolder?.children.filter(file => file instanceof TFile) ?? null;

        this.component = mount(HoardViewFileView, {
            target: this.contentEl,
            props: {
                files,
                view: this,
            },
        });
    }

    async onClose() {
        if (this.component === null) return;
        await unmount(this.component);
        this.component = null;
    }

    // Get the data from the view to save to disk
    getViewData(): string {
        return this.data;
    }

    // Load data from disk into the view
    setViewData(data: string, clear: boolean): void {
        this.data = data;
    }

    clear(): void {
        this.data = "";
    }
}
