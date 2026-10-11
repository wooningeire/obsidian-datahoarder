<script lang="ts">
import { Keymap, type FrontMatterCache, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";
import { Button } from "@vaie/hui";

let {
    file,
    frontmatter,
}: {
    file: TFile,
    frontmatter: FrontMatterCache,
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

<Button
    --bg-col="var(--color-accent)"
>
    <hoard-file>
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
    </hoard-file>
</Button>

<style lang="scss">
hoard-file {
    display: flex;
    flex-direction: column;
    width: 15em;

    white-space: nowrap;
    overflow: hidden;
}
</style>