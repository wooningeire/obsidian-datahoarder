import definition from "./Base.collection";
import type { CollectionView } from "./collection";
import type { Task, TaskPatch } from "../lib/pb";
import type { PbStore } from "../lib/datahoard/pbStore.svelte";


type TaskSource = Pick<
    PbStore,
    "tasksById" | "priorities" | "completions" | "terms" | "categories" | "totalTime"
>;

type TaskField = {
    field: keyof TaskPatch,
    type: "text" | "number" | "date" | "relation",
    options?: "tasks" | "priorities" | "completions" | "terms" | "categories",
    multiple?: boolean,
};

export const taskFields: Record<string, TaskField> = {
    basename: { field: "label", type: "text" },
    label: { field: "label", type: "text" },
    Parents: { field: "parent_tasks", type: "relation", options: "tasks", multiple: true },
    Dependencies: { field: "dependency_tasks", type: "relation", options: "tasks", multiple: true },
    Priority: { field: "priority", type: "relation", options: "priorities" },
    Completion: { field: "completion", type: "relation", options: "completions" },
    Term: { field: "term", type: "relation", options: "terms" },
    Categories: { field: "categories", type: "relation", options: "categories", multiple: true },
    "Hr initial estimate": { field: "hr_initial_estimate", type: "number" },
    "Hr remaining": { field: "hr_remaining", type: "number" },
    "Target start": { field: "target_start", type: "date" },
    "Target due": { field: "target_due", type: "date" },
    "Hard due": { field: "hard_due", type: "date" },
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
        case "Term": return source.terms.find(row => row.id === task.term)?.label ?? task.expand?.term?.label ?? task.term;
        case "Categories": return task.categories.map(id => (
            source.categories.find(row => row.id === id)?.label
            ?? task.expand?.categories?.find(row => row.id === id)?.label
            ?? id
        ));
        case "Hr completed": return source.totalTime(task.id) / 3600000;
    }
    return task[taskFields[column]?.field ?? column as keyof Task];
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
