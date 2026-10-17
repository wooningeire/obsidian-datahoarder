<script lang="ts">
import { Keymap, type FrontMatterCache, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";
import TaskClock from "../lib/datahoard/TaskClock.svelte";

let {
    file,
    frontmatter,
    index,
}: {
    file: TFile,
    frontmatter: FrontMatterCache,
    index: number,
} = $props();

const store = HoardViewStore.use();
const showHover = (event: MouseEvent | FocusEvent) => {
    store.view.app.workspace.trigger("hover-link", {
        event,
        source: "bases",
        hoverParent: store.view,
        targetEl: event.currentTarget,
        linktext: file.path,
    });
};
</script>

<hoard-file
    style:--n-entry={index}
>
    <button onclick={() => store.selectedTask = file}>
        Open
    </button>

    <hoard-file-id title={frontmatter["ID"]}>{frontmatter["ID"]}</hoard-file-id>

    <a
        href={file.path}
        onclick={event => {
            if (event.button !== 0 && event.button !== 1) return;

            event.preventDefault();
            const path = file.path;
            const modEvent = Keymap.isModEvent(event);
            store.view.app.workspace.openLinkText(path, "", modEvent);
        }}
        onmouseover={showHover}
        onfocus={showHover}
    >
        {file.name}
    </a>
    <TaskClock compact taskId={store.taskId(file)} label={file.basename} onToggle={() => store.toggleClock(file)} />


    <!-- {#each propertyOrder as propertyName}
        {entry.getValue(propertyName)}
    {/each} -->
</hoard-file>

<style lang="scss">
hoard-file {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;

    position: absolute;
    top: calc(2em * var(--n-entry));
    height: 2em;
    width: 100%;

    --n-entry: 0;

    > hoard-file-id {
        flex: 0 0 5em;

        display: block;
        width: 5em;
        overflow: hidden;

        text-overflow: ellipsis;
    }

    > a {
        flex: 1;

        display: block;
        min-width: 0;
        width: 10em;

        overflow: hidden;
        
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

hoard-details {
    display: flex;
    gap: 1em;

    height: 2em;

    white-space: nowrap;
    overflow: hidden;
}
</style>
