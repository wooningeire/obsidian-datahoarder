<script lang="ts">
import { Keymap, type CachedMetadata, type EventRef, type TFile } from "obsidian";
import { HoardViewStore } from "./HoardViewStore.svelte";
	import { onDestroy, onMount } from "svelte";

let {
    file,
}: {
    file: TFile,
} = $props();

const store = HoardViewStore.use();


let cache = $derived(store.view.app.metadataCache.getFileCache(file));
const frontmatter = $derived(cache?.frontmatter ?? {});


const onCacheUpdate = (file: TFile, data: string, newCache: CachedMetadata) => {
    cache = newCache;
};
let cacheChangedRef: EventRef;

onMount(() => {
    cacheChangedRef = store.view.app.metadataCache.on("changed", onCacheUpdate);
});

onDestroy(() => {
    store.view.app.metadataCache.offref(cacheChangedRef);
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

    {Object.entries(frontmatter)}
    <!-- {#each propertyOrder as propertyName}
        {entry.getValue(propertyName)}
    {/each} -->
</hoard-file>