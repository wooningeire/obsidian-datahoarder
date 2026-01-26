<script lang="ts">
import HoardEditor from "./HoardEditor.svelte";
import type { DatahoarderDbOps } from "../dbOps/DatahoarderDbOps";

let { dbOps }: { dbOps: DatahoarderDbOps } = $props();

let loadedFileContent = $state<string | null>(null);

export const setLoadedFileContent = (content: string) => {
    loadedFileContent = content;
};

export const getLoadedFileContent = () => {
    return loadedFileContent ?? "";
};

// $effect(() => {
//     if (loadedFileContent === null) return;

//     (async () => {
//         const blob = new Blob([loadedFileContent], { type: 'text/javascript' });
//         const url = URL.createObjectURL(blob);

//         const {default: module} = await import(url);

//         URL.revokeObjectURL(url);
//         console.log(module);
//     })();
// });


</script>

<h2>Sources</h2>

<h2>Columns</h2>

<h2>Filters</h2>

<h2>Sort</h2>