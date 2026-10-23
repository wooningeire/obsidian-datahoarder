import { listAll, create, update, remove } from "../pb";
import type {
    Task,
    TaskOption,
    TaskPatch,
    PriorityEnum,
    CompletionEnum,
    TimePeriod,
} from "../pb";
import { setContext, getContext, onMount, onDestroy } from "svelte";

//#region TODO needs review
export class PbStore {
    constructor(private beforeLoad: () => Promise<void> = async () => {}) {}

	tasks = $state<Task[]>([]);
	priorities = $state<PriorityEnum[]>([]);
	completions = $state<CompletionEnum[]>([]);
    terms = $state<TaskOption[]>([]);
    categories = $state<TaskOption[]>([]);
	timePeriods = $state<TimePeriod[]>([]);

    tasksById = $derived(new Map(this.tasks.map(task => [task.id, task])));
    periodsByTask = $derived.by(() => {
        const byTask = new Map<string, TimePeriod[]>();
        for (const period of this.timePeriods) {
            const periods = byTask.get(period.task);
            if (periods) periods.push(period);
            else byTask.set(period.task, [period]);
        }
        return byTask;
    });

    activeTimePeriod = $derived(this.timePeriods.find(period => !period.end) ?? null);
    ready = $state(false);
    busy = $state(false);
    error = $state("");
	now = $state(Date.now());
	reqFrame: number | undefined;

	async loadAll() {
        await this.beforeLoad();
        const [tasks, priorities, completions, periods, terms, categories] = await Promise.all([
            listAll<Task>("tasks", { expand: "priority,completion,categories,term", sort: "-created,id" }),
            listAll<PriorityEnum>("priority_enum", { sort: "value,id" }),
            listAll<CompletionEnum>("completion_enum", { sort: "id" }),
            listAll<TimePeriod>("task_time_periods", { sort: "-start,id" }),
            listAll<TaskOption>("task_terms", { sort: "label,id" }),
            listAll<TaskOption>("task_categories", { sort: "label,id" }),
		]);
        if (periods.filter(period => !period.end).length > 1) {
            throw new Error("PocketBase has multiple running timers. Stop the extra timers before tracking time.");
        }
        this.tasks = tasks;
        this.priorities = priorities;
        this.completions = completions;
        this.timePeriods = periods;
        this.terms = terms;
        this.categories = categories;
        this.ready = true;
	}

    async run(action: () => Promise<unknown>) {
        if (this.busy) return;
        this.busy = true;
        this.error = "";

        try {
            await action();
        } catch (error) {
            this.error = error instanceof Error ? error.message : String(error);
        } finally {
            this.busy = false;
        }
    }

	destroy() {
		if (this.reqFrame !== undefined) cancelAnimationFrame(this.reqFrame);
	}

	rootTasks(): Task[] {
		return this.tasks.filter(t => t.parent_tasks.length === 0);
	}

	childTasks(parentId: string): Task[] {
		return this.tasks.filter(t => t.parent_tasks.includes(parentId));
	}

	totalTime(taskId: string): number {
        let total = (this.tasksById.get(taskId)?.n_extra_hours ?? 0) * 3600000;
		for (const p of this.periodsByTask.get(taskId) ?? []) {
			const start = new Date(p.start).getTime();
			const end = p.end ? new Date(p.end).getTime() : this.now;
            total += Math.max(0, end - start);
		}
		return total;
	}

	startTicking() {
		if (this.reqFrame !== undefined) cancelAnimationFrame(this.reqFrame);
		const tick = () => {
			this.now = Date.now();
			this.reqFrame = requestAnimationFrame(tick);
		};
		this.reqFrame = requestAnimationFrame(tick);
	}

    async stopClock() {
        const active = this.activeTimePeriod;
        if (!active) return;
        const now = Date.now();
        if (now < Date.parse(active.start)) {
            throw new Error("The running timer starts in the future.");
        }
        const stoppedPeriod = await update<TimePeriod>("task_time_periods", active.id, {
            end: new Date(now).toISOString(),
        });
        this.timePeriods = this.timePeriods.map(period => period.id === active.id ? stoppedPeriod : period);
    }

    async toggleClock(taskId: string) {
        // Refresh before changing timers so a timer started by another client is stopped too.
        await this.loadAll();
        if (!this.tasksById.has(taskId)) {
            throw new Error("The linked PocketBase task no longer exists.");
        }
        const wasActiveTask = this.activeTimePeriod?.task;
        await this.stopClock();
        if (wasActiveTask === taskId) return;

		const period = await create<TimePeriod>("task_time_periods", {
			start: new Date().toISOString(),
			end: "",
			task: taskId,
		});
		this.timePeriods = [period, ...this.timePeriods];
	}

    async addTask(fields: Partial<Task>) {
        await this.beforeLoad();
        const task = await create<Task>("tasks", fields);
        this.tasks = [task, ...this.tasks];
        return task;
    };

	async deleteTask(id: string) {
		await remove("tasks", id);
		this.tasks = this.tasks.filter(t => t.id !== id);
		this.timePeriods = this.timePeriods.filter(p => p.task !== id);

	}

    private applyTaskPatch = (taskId: string, patch: Partial<Task>): void => {
        const index = this.tasks.findIndex(task => task.id === taskId);
        const task = this.tasks[index];
        if (task) this.tasks[index] = { ...task, ...patch };
    };

    updateTask = async (taskId: string, patch: TaskPatch): Promise<void> => {
        const updated = await update<Task>("tasks", taskId, patch);
        this.applyTaskPatch(taskId, {
            ...Object.fromEntries(Object.keys(patch).map(field => [field, updated[field as keyof Task]])),
            updated: updated.updated,
            expand: {
                ...this.tasksById.get(taskId)?.expand,
                ...(patch.priority !== undefined ? {
                    priority: this.priorities.find(row => row.id === updated.priority),
                } : {}),
                ...(patch.completion !== undefined ? {
                    completion: this.completions.find(row => row.id === updated.completion),
                } : {}),
                ...(patch.term !== undefined ? { term: undefined } : {}),
                ...(patch.categories !== undefined ? { categories: undefined } : {}),
            },
        });
    };

	async saveEdit(task: Task, newLabel: string) {
		if (newLabel.trim() && newLabel !== task.label) {
			const updated = await update<Task>("tasks", task.id, { label: newLabel.trim() });
            this.applyTaskPatch(task.id, { label: updated.label });
		}
	}

	async setArchive(taskId: string, archive: boolean) {
		const updated = await update<Task>("tasks", taskId, { archive });
        this.applyTaskPatch(taskId, { archive: updated.archive });
	}

	async setPriority(taskId: string, priorityId: string) {
		const updated = await update<Task>("tasks", taskId, { priority: priorityId || "" });
        this.applyTaskPatch(taskId, { priority: updated.priority });
	}

	async setCompletion(taskId: string, completionId: string) {
		const updated = await update<Task>("tasks", taskId, { completion: completionId || "" });
        this.applyTaskPatch(taskId, { completion: updated.completion });
	}

	async setParentTasks(taskId: string, parentIds: string[]) {
		const updated = await update<Task>("tasks", taskId, { parent_tasks: parentIds });
        this.applyTaskPatch(taskId, { parent_tasks: updated.parent_tasks });
	}

	async setTargetDue(taskId: string, dateStr: string) {
		const iso = dateStr ? new Date(dateStr).toISOString() : "";
		const updated = await update<Task>("tasks", taskId, { target_due: iso });
        this.applyTaskPatch(taskId, { target_due: updated.target_due });
	}

	async setHardDue(taskId: string, dateStr: string) {
		const iso = dateStr ? new Date(dateStr).toISOString() : "";
		const updated = await update<Task>("tasks", taskId, { hard_due: iso });
        this.applyTaskPatch(taskId, { hard_due: updated.hard_due });
	}
}

export const PB_CONTEXT_KEY = Symbol("pb_store");

export const setPbStore = () => {
	const store = new PbStore();
	
	onMount(() => {
        store.run(() => store.loadAll());
		store.startTicking();
	});

	onDestroy(() => {
		store.destroy();
	});

	return setContext(PB_CONTEXT_KEY, store);
};

export const getPbStore = () => {
    return getContext<PbStore>(PB_CONTEXT_KEY);
};

export const formatMs = (ms: number): string => {
    const secs = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const toDatetimeLocal = (iso: string): string => {
    if (!iso) return "";
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};
// #endregion
