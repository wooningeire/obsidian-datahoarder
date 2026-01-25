import { ItemView, WorkspaceLeaf } from 'obsidian';
import HoardEditor from './components/HoardView.svelte';
import { mount, unmount } from 'svelte';
import type { DatahoarderDbOps } from './dbOps/DatahoarderDbOps';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  // A variable to hold on to the Counter instance mounted in this ItemView.
  counter: ReturnType<typeof HoardEditor> | undefined;

  constructor(
    leaf: WorkspaceLeaf,
    private dbOps: DatahoarderDbOps,
  ) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_EXAMPLE;
  }

  getDisplayText() {
    return 'Example view';
  }

  async onOpen() {
    // Attach the Svelte component to the ItemViews content element and provide the needed props.
    this.counter = mount(HoardEditor, {
      target: this.contentEl,
      props: {
        dbOps: this.dbOps,
      }
    });
  }

  async onClose() {
    if (this.counter) {
      // Remove the Counter from the ItemView.
      unmount(this.counter);
    }
  }
}
