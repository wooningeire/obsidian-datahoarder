import { TextFileView, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import HoardViewFileView from './components/HoardViewFileView.svelte';
import type { DatahoarderDbOps } from './dbOps/DatahoarderDbOps';

export const VIEW_TYPE_HOARD = 'hoard-view';

export class HoardView extends TextFileView {
  component: any;
  data = "";

  constructor(
    leaf: WorkspaceLeaf,
    private dbOps: DatahoarderDbOps
  ) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_HOARD;
  }

  getDisplayText() {
    return this.file ? this.file.basename : 'Hoard View';
  }

  async onOpen() {
    this.component = mount(HoardViewFileView as any, {
      target: this.contentEl,
      props: {
        dbOps: this.dbOps,
        onChange: (content: string) => {
            if (content !== this.data) {
                // this.data = content;
                this.requestSave();
            }
        }
      }
    });

    if (this.data) {
      this.component.setLoadedFileContent(this.data);
      this.data = "";
    }
  }

  async onClose() {
    if (this.component) {
      unmount(this.component);
    }
  }

  // Get the data from the view to save to disk
  getViewData(): string {
    return this.component ? this.component.getLoadedFileContent() : this.data;
  }

  // Load data from disk into the view
  setViewData(data: string, clear: boolean): void {
    if (this.component) {
      this.component.setLoadedFileContent(data);
    } else {
      this.data = data;
    }
  }

  clear(): void {
    if (this.component) {
        this.component.setLoadedFileContent("");
    }
    this.data = "";
  }
}
