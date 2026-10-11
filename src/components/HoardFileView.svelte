<script lang="ts">
import { Keymap, type FrontMatterCache, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";
import { Button } from "@vaie/hui";

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
    <button>
        <hoard-file-details>
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

            {Object.entries(frontmatter)}
            <!-- {#each propertyOrder as propertyName}
                {entry.getValue(propertyName)}
            {/each} -->
        </hoard-file-details>
    </button>
</hoard-file>

<style lang="scss">
hoard-file {
    display: grid;
    place-items: stretch;

    width: 100%;
    overflow-x: auto;
    position: absolute;
    top: calc(2em * var(--n-entry));

    --n-entry: 0;
}

hoard-details {
    display: flex;
    gap: 1em;

    height: 2em;

    white-space: nowrap;
    overflow: hidden;
}
</style>