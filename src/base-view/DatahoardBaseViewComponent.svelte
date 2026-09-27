<script lang="ts">
	import { Keymap } from "obsidian";
import type { MyBasesView } from "./DatahoardBaseView";
import type { DatahoardBaseViewState } from "./DatahoardBaseViewState.svelte";

let {
    view,
    viewState,
}: {
    view: MyBasesView,
    viewState: DatahoardBaseViewState,
} = $props();

const propertyOrder = $derived(view.config.getOrder());

$inspect(viewState.groups);
</script>

<base-entry-list>
    {#each viewState.groups as group}
        {#each group.entries as entry}
            <base-entry>
                <a
                    onclick={event => {
                        if (event.button !== 0 && event.button !== 1) return;

                        event.preventDefault();
                        const path = entry.file.path;
                        const modEvent = Keymap.isModEvent(event);
                        view.app.workspace.openLinkText(path, "", modEvent);
                    }}
                    onmouseover={event => {
                        view.app.workspace.trigger('hover-link', {
                            event: event,
                            source: 'bases',
                            hoverParent: view,
                            targetEl: event.currentTarget,
                            linktext: entry.file.path,
                        });
                    }}
                >
                    {entry.file.name}
                </a>
                {#each propertyOrder as propertyName}
                    {entry.getValue(propertyName)}
                {/each}
            </base-entry>
        {/each}
    {/each}
</base-entry-list>

<style lang="scss">
base-entry-list {
    display: flex;
    flex-direction: column;
}
</style>