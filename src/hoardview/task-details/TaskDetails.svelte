<script lang="ts">
    import type { Task } from "../../lib/pb";
import { HoardViewStore } from "../HoardViewStore.svelte";
import { taskAncestors } from "../taskGraph";
import TaskClock from "../../lib/datahoard/TaskClock.svelte";
import TaskNoteLink from "../TaskNoteLink.svelte";
import TimeHistory from "./TimeHistory.svelte";

let {
    task,
}: {
    task: Task,
} = $props();

const store = HoardViewStore.use();

const ancestors = $derived(taskAncestors(task.id, store.taskGraph));
const children = $derived(store.taskGraph.childrenById.get(task.id));
</script>


<button onclick={() => store.selectedTask = null}>
    close
</button>

<h2>{task.label}</h2>

<TaskNoteLink {task} />
<TaskClock taskId={task.id} />
<TimeHistory taskId={task.id} />

<h3>Ancestry</h3>

{#if ancestors.length === 0}
    <button>
        
    </button>
{:else}
    <task-ancestry-list>
        {#each ancestors as ancestor (ancestor.id)}
            <button onclick={() => store.selectTask(ancestor.id)}>
                {ancestor.label}
            </button>
        {/each}
    </task-ancestry-list>
{/if}

<h3>Children</h3>

<task-children-list>
    {#each children as child (child.id)}
        <button onclick={() => store.selectTask(child.id)}>
            {child.label}
        </button>
    {/each}
</task-children-list>

<style lang="scss">
task-ancestry-list {
    display: flex;
    flex-direction: column;
}
</style>
