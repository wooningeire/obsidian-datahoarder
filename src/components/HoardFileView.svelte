<script lang="ts">
import { Keymap, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";

let {
    file,
}: {
    file: TFile,
} = $props();

const store = HoardViewStore.use();


const frontmatterPromise = new Promise<object>(resolve => {
    return store.view.app.fileManager.processFrontMatter(file, resolve);
});
</script>

<hoard-file>
    {file.name}
    <a
        onclick={event => {
            if (event.button !== 0 && event.button !== 1) return;

            event.preventDefault();
            const path = file.path;
            const modEvent = Keymap.isModEvent(event);
            store.view.app.workspace.openLinkText(path, "", modEvent);
        }}
        onmouseover={event => {
            store.view.app.workspace.trigger('hover-link', {
                event: event,
                source: 'bases',
                hoverParent: store.view,
                targetEl: event.currentTarget,
                linktext: file.path,
            });
        }}
    >
        {file.name}
    </a>

    {#await frontmatterPromise}
        waiting...
    {:then frontmatter}
        {Object.keys(frontmatter)}
    {/await}
    <!-- {#each propertyOrder as propertyName}
        {entry.getValue(propertyName)}
    {/each} -->
</hoard-file>