<!-- #region TODO needs review -->

<script lang="ts">
	import { getPbStore } from "./pbStore.svelte";
    import type { TimePeriod } from "../pb";

    let { onSelectPeriod }: {
        onSelectPeriod?: (period: TimePeriod) => void,
    } = $props();

	const store = getPbStore();


    const getMonday = (d: Date): Date => {
		const date = new Date(d);
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1);
		return new Date(date.setDate(diff));
    };

    let selectedDay = $state(new Date());
    let weekStart = $derived.by(() => {
        const d = getMonday(selectedDay);
		d.setHours(0, 0, 0, 0);
		return d;
	});

    let days = $derived.by(() => {
        const base = weekStart;
		return Array.from({ length: 7 }).map((_, i) => {
			const d = new Date(base);
			d.setDate(d.getDate() + i);
			return d;
		});
	});

    const dayEnd = (day: Date): number => {
        const end = new Date(day);
        end.setDate(end.getDate() + 1);
        return end.getTime();
    };

    const changeWeek = (offset: number): void => {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + offset);
        selectedDay = day;
    };

    const getGroupedTasksForDay = (day: Date) => {
		const startMs = day.getTime();
        const endMs = dayEnd(day);
		const tasksForDay = store.tasks.filter((t) => {
			if (!t.hard_due) return false;
			const dueMs = new Date(t.hard_due).getTime();
			return dueMs >= startMs && dueMs < endMs;
		});

		// Sort chronologically
		tasksForDay.sort((a, b) => new Date(a.hard_due).getTime() - new Date(b.hard_due).getTime());

		// Group tasks within 15 minutes (900000 ms) of each other
		const groups: { dueMs: number; labels: string[] }[] = [];
		for (const t of tasksForDay) {
			const dueMs = new Date(t.hard_due).getTime();
			const label = t.label || "(untitled)";
            const lastGroup = groups[groups.length - 1];
            if (lastGroup) {
				if (dueMs - lastGroup.dueMs <= 900000) {
					lastGroup.labels.push(label);
					continue;
				}
			}
			groups.push({ dueMs, labels: [label] });
		}
		return groups;
    };

    const nowDate = $derived(new Date(store.now));
    const nowPct = $derived(((nowDate.getHours() + nowDate.getMinutes() / 60) / 24) * 100);

    const getPeriodsForDay = (day: Date) => {
		const dayStartMs = day.getTime();
        const dayEndMs = dayEnd(day);
        const dayLength = dayEndMs - dayStartMs;

		return store.timePeriods
			.filter((p) => {
				const startMs = new Date(p.start).getTime();
				const endMs = p.end ? new Date(p.end).getTime() : store.now;
				return startMs < dayEndMs && endMs > dayStartMs;
			})
			.map((p) => {
				const startMs = Math.max(new Date(p.start).getTime(), dayStartMs);
				const endMs = Math.min(p.end ? new Date(p.end).getTime() : store.now, dayEndMs);
                const task = store.tasksById.get(p.task);
				return {
                    ...p,
                    topPct: ((startMs - dayStartMs) / dayLength) * 100,
                    heightPct: ((endMs - startMs) / dayLength) * 100,
                    label: task?.label || (p.task ? "Missing task" : "Unassigned"),
					active: !p.end,
				};
			});
    };
</script>

<task-calendar>
    <div class="toolbar">
        <h2>Calendar</h2>
        <button onclick={() => changeWeek(-7)} aria-label="Previous week">←</button>
        <button onclick={() => selectedDay = new Date(store.now)}>Today</button>
        <button onclick={() => changeWeek(7)} aria-label="Next week">→</button>
        <label>
            Week
            <input
                type="date"
                value={weekStart.toLocaleDateString("en-CA")}
                onchange={event => {
                    const day = new Date(`${event.currentTarget.value}T00:00:00`);
                    if (Number.isFinite(day.getTime())) selectedDay = day;
                }}
            />
        </label>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="calendar-scroller" tabindex="0" role="region" aria-label="Scrollable week">
	<div class="calendar-grid">
		<div class="time-axis-col">
            <div class="day-header" aria-hidden="true" style="color: transparent;">Time</div>
			<div class="time-axis">
				{#each Array.from({ length: 25 }) as _, hour}
					<div class="time-label" style="top: {(hour / 24) * 100}%">
						{hour.toString().padStart(2, "0")}:00
					</div>
				{/each}
			</div>
		</div>

		{#each days as day}
			<div class="day-col">
				<div class="day-header">
					{day.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "2-digit", day: "2-digit",  })}
				</div>
				<div class="day-body">
					<!-- Time grid lines -->
					{#each Array.from({ length: 25 }) as _, hour}
						<div class="grid-line" style="top: {(hour / 24) * 100}%"></div>
					{/each}

					<!-- Current time indicator if today -->
					{#if day.toDateString() === nowDate.toDateString()}
						<div class="current-time-line" style="top: {nowPct}%"></div>
					{/if}

					<!-- Tasks -->
					{#each getGroupedTasksForDay(day) as group}
						{@const date = new Date(group.dueMs)}
						{@const hours = date.getHours() + date.getMinutes() / 60}
						{@const topPercent = (hours / 24) * 100}
						
                        <div class="task-line" style="top: {topPercent}%" title={group.labels.join(", ")}>
                            <div class="fade-up"></div>
							<span class="task-label">{group.labels.join(", ")}</span>
						</div>
					{/each}

					<!-- Time periods -->
					{#each getPeriodsForDay(day) as period (period.id)}
                        <button
							class="time-period"
							class:active={period.active}
							style="top: {period.topPct}%; height: {period.heightPct}%"
                            onclick={() => onSelectPeriod?.(period)}
                            title={period.label}
                            aria-label={`${period.label}, ${new Date(period.start).toLocaleString()} to ${period.end ? new Date(period.end).toLocaleString() : "running"}`}
						>
							<span class="period-label">{period.label}</span>
                        </button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
    </div>
</task-calendar>

<style lang="scss">
    task-calendar {
        flex: 1;

        display: flex;
        flex-direction: column;

        min-width: 0;
        min-height: 0;
    }

    .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    h2 {
        margin: 0;

        font-size: 1.1rem;
    }

    label {
        margin-left: auto;

        font-size: 0.85rem;
    }

    .calendar-scroller {
        flex: 1;

        min-height: 0;
        margin-top: 0.5rem;
        overflow: auto;
    }

	.calendar-grid {
		display: grid;
        grid-template-columns: 3.125rem repeat(7, minmax(6.5rem, 1fr));

		height: 50em;
        padding: 0 0.5em;
        margin: 0.75em 0;
	}

	.time-axis-col {
		display: flex;
		flex-direction: column;
		border-right: 2px solid oklch(1 0 0 / 0.5);
	}

	.time-axis {
		flex: 1;
		position: relative;

		.time-label {
			position: absolute;
			transform: translateY(-50%);
			right: 0.5em;

            &:first-child {
                transform: none;
            }

            &:last-child {
                transform: translateY(-100%);
            }
		}
	}

	.day-col {
        min-width: 0;
		display: flex;
		flex-direction: column;
		border-right: 1px solid oklch(1 0 0 / 0.5);

		&:last-child {
			border-right: none;
		}
	}

	.day-header {
        flex-shrink: 0;

        position: sticky;
        top: 0;
        z-index: 20;

        box-sizing: border-box;
        height: 3.5rem;
		padding: 0.5em;
		border-bottom: 1px solid oklch(1 0 0 / 0.5);

        background: var(--background-primary, oklch(0.25 0.01 250));
	}

	.day-body {
		flex: 1;
		position: relative;

		.grid-line {
			position: absolute;
			left: 0;
			right: 0;
			height: 1px;
			background: oklch(1 0 0 / 0.15);
			z-index: 0;
		}

		.current-time-line {
			position: absolute;
			left: 0;
			right: 0;
			height: 2px;
			background: oklch(0.9 0.2 160);
			z-index: 10;
		}

		.task-line {
			position: absolute;
			left: 0;
			right: 0;
			border-top: 2px solid oklch(0.9 0.2 350);
			z-index: 5;

			.fade-up {
				position: absolute;
				bottom: 0; // sits right above the border top
				left: 0;
				right: 0;
				height: 60px; // roughly ~2.4 hours visually in a 600px grid
				background: linear-gradient(to top, oklch(0.9 0.2 350 / 0.3), oklch(0 0 0 / 0));
				pointer-events: none;
			}

			.task-label {
				position: absolute;
				top: 0;
				padding: 0 4px;
				border-radius: 0 0 4px 4px;
                max-width: 100%;
                box-sizing: border-box;
                overflow: hidden;

				color: oklch(0.9 0.2 350 / 0.7);
                text-overflow: ellipsis;
                white-space: nowrap;
			}
		}

		.time-period {
			position: absolute;
			left: 2px;
			right: 2px;
			min-height: 2px;
            padding: 0;
            border: 0;
			background: oklch(0.7 0.15 250 / 0.25);
			border-left: 3px solid oklch(0.7 0.15 250);
			border-radius: 2px;
			z-index: 3;
			overflow: hidden;
            text-align: left;

			&.active {
				background: oklch(0.7 0.15 160 / 0.25);
				border-left-color: oklch(0.7 0.15 160);
			}

			.period-label {
				padding: 1px 4px;
				font-size: 0.7em;
				white-space: nowrap;
				color: oklch(0.7 0.1 250);
			}
		}
	}
</style>

<!-- #endregion -->