<script lang="ts">
import { Keymap } from "obsidian";
import type { Task } from "../../lib/pb";
import { HoardViewStore } from "../HoardViewStore.svelte";

let {
    task,
}: {
    task: Task,
} = $props();

const store = HoardViewStore.use();

const openNote = (event: MouseEvent): void => {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    store.openNote(task.id, Keymap.isModEvent(event));
};

const showHover = (event: MouseEvent | FocusEvent): void => {
    store.view.app.workspace.trigger("hover-link", {
        event,
        source: "bases",
        hoverParent: store.view,
        targetEl: event.currentTarget,
        linktext: task.note_path,
    });
};
</script>


{#if task.note_path}
    <a
        href={task.note_path}
        onclick={openNote}
        onauxclick={openNote}
        onmouseover={showHover}
        onfocus={showHover}
    >
        note
    </a>
{/if}
