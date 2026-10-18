export const DEFAULT_POCKETBASE_API = "http://127.0.0.1:8090/api";

let base = DEFAULT_POCKETBASE_API;

export const configurePocketBase = (apiUrl: string): void => {
    const url = new URL(apiUrl);
    base = url.href.replace(/\/+$/, "");
};

export type PbListResult<T> = {
	page: number,
	perPage: number,
	totalPages: number,
	totalItems: number,
	items: T[],
};

export type PbRecord = {
	id: string,
	created: string,
	updated: string,
};

export type PriorityEnum = PbRecord & {
	label: string,
	value: number,
};

export type CompletionEnum = PbRecord & {
	label: string,
};

export type Task = PbRecord & {
	label: string,
	priority: string,
	parent_tasks: string[],
	dependency_tasks: string[],
	note_key: string,
	note_path: string,
	hr_initial_estimate: number,
	hr_remaining: number,
	categories: string[],
	term: string,
	target_start: string,
	target_due: string,
	hard_due: string,
	completion: string,
	n_extra_hours: number,
	archive: boolean,
	expand?: {
		priority?: PriorityEnum,
		completion?: CompletionEnum,
	},
};

export type TimePeriod = PbRecord & {
	start: string,
	end: string,
	task: string,
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let res: Response;
    try {
        res = await fetch(`${base}${path}`, init);
    } catch {
        throw new Error("failed to reach PocketBase server");
    }

	if (!res.ok) {
		throw new Error(`PB ${res.status}: ${await res.text()}`);
	}
	if (res.status === 204) {
		return undefined as T; // TODO is there a better way to do this
	}

	return res.json();
};

export const list = <T extends PbRecord>(collection: string, params: Record<string, string> = {}): Promise<PbListResult<T>> => {
	const query = new URLSearchParams({ perPage: "200", ...params }).toString();
	return request(`/collections/${collection}/records?${query}`);
};

export const listAll = async <T extends PbRecord>(
    collection: string,
    params: Record<string, string> = {},
): Promise<T[]> => {
    const records: T[] = [];
    let nPage = 1;
    let nPages = 1;

    do {
        const result = await list<T>(collection, { ...params, page: String(nPage) });
        records.push(...result.items);
        nPages = result.totalPages;
        nPage++;
    } while (nPage <= nPages);

    return records;
};

export const create = <T extends PbRecord>(collection: string, data: Record<string, unknown>): Promise<T> => {
	return request(`/collections/${collection}/records`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const update = <T extends PbRecord>(collection: string, id: string, data: Record<string, unknown>): Promise<T> => {
	return request(`/collections/${collection}/records/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
};

export const remove = (collection: string, id: string): Promise<void> => {
	return request(`/collections/${collection}/records/${id}`, {
		method: "DELETE",
	});
};
