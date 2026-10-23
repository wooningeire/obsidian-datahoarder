<script lang="ts">
import { HoardViewStore } from "../HoardViewStore.svelte";
import CollectionTable from "./CollectionTable.svelte";
import CollectionCards from "./CollectionCards.svelte";

const store = HoardViewStore.use();

const cards = $derived(store.collectionView?.type === "cards");
const columns = $derived(store.collectionView?.columns?.length
    ? store.collectionView.columns : ["basename"]);


// TODO why 5.5?
const rowEm = $derived(cards ? 5.5 + columns.length * 2 : 2);

let element: HTMLElement | null = $state(null);
let scrollTop = $state(0);
let width = $state(0);
let height = $state(0);
const layout = $derived.by(() => {
    if (element === null) {
        return {
            perRow: 1,
            rows: [],
        };
    }

    const fontSize = parseFloat(getComputedStyle(element).fontSize.replaceAll(/[^\d.]/g, ""));

    const perRow = cards ? Math.max(1, Math.floor((width / fontSize + 0.5) / 16.5)) : 1;
    const rowCount = Math.ceil(store.visibleTasks.length / perRow);
    const rowHeight = rowEm * fontSize;
    const first = Math.max(0, Math.min(Math.floor(scrollTop / rowHeight) - 2, rowCount - 1));
    const last = Math.min(rowCount, first + Math.ceil(height / rowHeight) + 5);

    return {
        perRow,
        rows: Array.from({ length: last - first }, (_, index) => first + index)
    };
});
</script>


<collection-records
    onscroll={() => scrollTop = element!.scrollTop}
    bind:this={element}
    bind:clientWidth={width}
    bind:clientHeight={height}
>
    {#if cards}
        <CollectionCards {columns} rows={layout.rows} perRow={layout.perRow} {rowEm} />
    {:else}
        <CollectionTable {columns} rows={layout.rows} />
    {/if}
</collection-records>


<style lang="scss">
collection-records {
    display: block;
    flex: 1;
    min-width: 0;
    min-height: 0;
    
    overflow: auto;
}
</style>
