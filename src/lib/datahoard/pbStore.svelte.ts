import { listAll, create, update, remove } from "../pb";
import type { Task, PriorityEnum, CompletionEnum, TimePeriod } from "../pb";
import { setContext, getContext, onMount, onDestroy } from "svelte";

//#region TODO needs review
export class PbStore {
    constructor(private beforeLoad: () => Promise<void> = async () => {}) {}

	tasks = $state<Task[]>([]);
	priorities = $state<PriorityEnum[]>([]);
	completions = $state<CompletionEnum[]>([]);
	timePeriods = $state<TimePeriod[]>([]);

    activeTimePeriod = $derived(this.timePeriods.find(period => !period.end) ?? null);
    ready = $state(false);
    busy = $state(false);
    error = $state("");
	now = $state(Date.now());
	reqFrame: number | undefined;

	async loadAll() {
        await this.beforeLoad();
        const [tasks, priorities, completions, periods] = await Promise.all([
            listAll<Task>("tasks", { expand: "priority,completion", sort: "-created,id" }),
            listAll<PriorityEnum>("priority_enum", { sort: "value,id" }),
            listAll<CompletionEnum>("completion_enum", { sort: "id" }),
            listAll<TimePeriod>("task_time_periods", { sort: "-start,id" }),
		]);
        if (periods.filter(period => !period.end).length > 1) {
            throw new Error("PocketBase has multiple running timers. Stop the extra timers before tracking time.");
        }
        this.tasks = tasks;
        this.priorities = priorities;
        this.completions = completions;
        this.timePeriods = periods;
        this.ready = true;
	}

    run = async (action: () => Promise<unknown>): Promise<void> => {
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
    };

	destroy() {
		if (this.reqFrame !== undefined) cancelAnimationFrame(this.reqFrame);
	}

	rootTasks(): Task[] {
		return this.tasks.filter(t => !t.parent_task);
	}

	childTasks(parentId: string): Task[] {
		return this.tasks.filter(t => t.parent_task === parentId);
	}

	totalTime(taskId: string): number {
        let total = (this.tasks.find(task => task.id === taskId)?.n_extra_hours ?? 0) * 3600000;
		for (const p of this.timePeriods.filter(tp => tp.task === taskId)) {
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
        if (!this.tasks.some(task => task.id === taskId)) {
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

	async addTask(label: string) {
		if (!label.trim()) return;
		const task = await create<Task>("tasks", { label: label.trim() });
		this.tasks = [task, ...this.tasks];
        return task;
	}

	async deleteTask(id: string) {
		await remove("tasks", id);
		this.tasks = this.tasks.filter(t => t.id !== id);
		this.timePeriods = this.timePeriods.filter(p => p.task !== id);

	}

	async saveEdit(task: Task, newLabel: string) {
		if (newLabel.trim() && newLabel !== task.label) {
			const updated = await update<Task>("tasks", task.id, { label: newLabel.trim() });
			const idx = this.tasks.findIndex(t => t.id === task.id);
			if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, label: updated.label };
		}
	}

	async setArchive(taskId: string, archive: boolean) {
		const updated = await update<Task>("tasks", taskId, { archive });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, archive: updated.archive };
	}

	async setPriority(taskId: string, priorityId: string) {
		const updated = await update<Task>("tasks", taskId, { priority: priorityId || "" });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, priority: updated.priority };
	}

	async setCompletion(taskId: string, completionId: string) {
		const updated = await update<Task>("tasks", taskId, { completion: completionId || "" });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, completion: updated.completion };
	}

	async setParentTask(taskId: string, parentId: string) {
		const updated = await update<Task>("tasks", taskId, { parent_task: parentId || "" });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, parent_task: updated.parent_task };
	}

	async setTargetDue(taskId: string, dateStr: string) {
		const iso = dateStr ? new Date(dateStr).toISOString() : "";
		const updated = await update<Task>("tasks", taskId, { target_due: iso });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, target_due: updated.target_due };
	}

	async setHardDue(taskId: string, dateStr: string) {
		const iso = dateStr ? new Date(dateStr).toISOString() : "";
		const updated = await update<Task>("tasks", taskId, { hard_due: iso });
		const idx = this.tasks.findIndex(t => t.id === taskId);
		if (idx >= 0) this.tasks[idx] = { ...this.tasks[idx]!, hard_due: updated.hard_due };
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