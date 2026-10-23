import type { CompletionEnum, Task } from "../../lib/pb";


export type TaskGraph = {
    tasksById: Map<string, Task>,
    parentsById: Map<string, Task[]>,
    childrenById: Map<string, Task[]>,
    leafTasks: Task[],
};


export const createTaskGraph = (
    tasks: Task[],
    completions: CompletionEnum[],
): TaskGraph => {
    const tasksById = new Map(tasks.map(task => [task.id, task]));
    const parentsById = new Map<string, Task[]>(tasks.map(task => [task.id, []]));
    const childrenById = new Map<string, Task[]>(tasks.map(task => [task.id, []]));

    for (const task of tasks) {
        for (const parentId of new Set(task.parent_tasks)) {
            const parent = tasksById.get(parentId);
            if (!parent || parentId === task.id) continue;

            parentsById.get(task.id)!.push(parent);
            childrenById.get(parentId)!.push(task);
        }
    }

    const closedCompletionIds = new Set(completions
        .filter(completion => completion.label === "Done" || completion.label === "Dropped")
        .map(completion => completion.id));

    return {
        tasksById,
        parentsById,
        childrenById,
        leafTasks: tasks.filter(task => (
            !task.archive
            && !closedCompletionIds.has(task.completion)
            && childrenById.get(task.id)!.length === 0
        )),
    };
};


export const taskAncestors = (taskId: string, graph: TaskGraph): Task[] => {
    const ancestors: Task[] = [];
    const seen = new Set([taskId]);
    const pending = [...graph.parentsById.get(taskId) ?? []];

    for (let index = 0; index < pending.length; index++) {
        const parent = pending[index]!;
        if (seen.has(parent.id)) continue;

        seen.add(parent.id);
        ancestors.push(parent);
        pending.push(...graph.parentsById.get(parent.id) ?? []);
    }

    return ancestors;
};
