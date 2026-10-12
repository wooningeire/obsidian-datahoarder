<script lang="ts">
import { Keymap, type FrontMatterCache, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";

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

    <hoard-file-id>{frontmatter["ID"]}</hoard-file-id>

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


    <!-- {#each propertyOrder as propertyName}
        {entry.getValue(propertyName)}
    {/each} -->
</hoard-file>

<style lang="scss">
hoard-file {
    display: flex;
    flex-direction: row;
    position: absolute;
    top: calc(2em * var(--n-entry));

    --n-entry: 0;

    > hoard-file-id {
        display: block;
        width: 5em;
    }

    > a {
        display: block;
        width: 10em;

        overflow-x: auto;
        
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