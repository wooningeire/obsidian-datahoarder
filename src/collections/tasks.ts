import definition from "./Base.collection";
import type { CollectionView } from "./collection";
import type { Task } from "../lib/pb";
import type { PbStore } from "../lib/datahoard/pbStore.svelte";


type TaskSource = Pick<PbStore, "tasksById" | "priorities" | "completions" | "totalTime">;

const fields: Record<string, keyof Task> = {
    basename: "label",
    "Hr initial estimate": "hr_initial_estimate",
    "Hr remaining": "hr_remaining",
    "Target start": "target_start",
    "Target due": "target_due",
    "Hard due": "hard_due",
};


export const taskValue = (task: Task, column: string, source: TaskSource): unknown => {
    const field = definition.schema[column];
    if (typeof field === "object" && field.derive) {
        return field.derive({ record: task, value: column => taskValue(task, column, source) });
    }
    switch (column) {
        case "Parents": return task.parent_tasks.map(id => source.tasksById.get(id)?.label ?? id);
        case "Dependencies": return task.dependency_tasks.map(id => source.tasksById.get(id)?.label ?? id);
        case "Priority": return source.priorities.find(row => row.id === task.priority)?.label ?? task.priority;
        case "Completion": return source.completions.find(row => row.id === task.completion)?.label ?? task.completion;
        case "Term": return task.expand?.term?.label ?? task.term;
        case "Categories": return task.expand?.categories?.map(row => row.label) ?? task.categories;
        case "Hr completed": return source.totalTime(task.id) / 3600000;
    }
    return task[fields[column] ?? column as keyof Task];
};


export const selectTasks = (tasks: Task[], view: CollectionView, source: TaskSource): Task[] => {
    const filters = view.filter?.split(/\s+/).filter(Boolean) ?? [];
    const selected = tasks.filter(task => filters.every(filter => {
        const negative = filter.startsWith("-");
        const [column, expected] = (negative ? filter.slice(1) : filter).split("=");
        return (String(taskValue(task, column!, source) ?? "") === expected) !== negative;
    }));
    if (view.sortColumn) {
        selected.sort((left, right) => {
            const a = taskValue(left, view.sortColumn!, source);
            const b = taskValue(right, view.sortColumn!, source);
            const emptyA = a === undefined || a === null || a === "";
            const emptyB = b === undefined || b === null || b === "";
            if (emptyA || emptyB) return Number(emptyA) - Number(emptyB);
            const order = typeof a === "number" && typeof b === "number"
                ? a - b : String(a).localeCompare(String(b), undefined, { numeric: true });
            return order * (view.sortDirection === "desc" ? -1 : 1);
        });
    }
    return selected;
};
