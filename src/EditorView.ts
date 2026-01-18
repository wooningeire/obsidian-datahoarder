import { ItemView, WorkspaceLeaf } from 'obsidian';

// Import the Counter Svelte component and the `mount` and `unmount` methods.
import HoardEditor from './HoardEditor.svelte';
import { mount, unmount } from 'svelte';
import type { Database } from 'sql.js';

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
  // A variable to hold on to the Counter instance mounted in this ItemView.
  counter: ReturnType<typeof HoardEditor> | undefined;

  constructor(
    leaf: WorkspaceLeaf,
    private db: Database,
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
        db: this.db,
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
