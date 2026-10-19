import { collection, derived } from "./collection";


export default collection({
    name: "Goals",
    source: {
        type: "pocketbase",
        collection: "tasks",
    },
    schema: {
        "formula.Untitled": derived(() => ""),
        Parents: "text",
        Dependencies: "text",
        "Hr completed": "number",
        "Hr initial estimate": "number",
        "Hr remaining": "number",
        "Hr estimate": derived(({ value }) => (
            Number(value("Hr completed")) + Number(value("Hr remaining"))
        ), { type: "number" }),
        Completion: "text",
        "Target start": "date",
        "Target due": "date",
        "Hard due": "date",
        Priority: "text",
        Term: "text",
        Categories: "text",
    },
    views: [
        {
            name: "All",
            type: "table",
            columns: [
                "Parents",
                "basename",
                "Dependencies",
                "Hr completed",
                "Completion",
                "Target start",
                "Target due",
                "Hard due",
                "Priority",
                "Term",
                "Categories",
            ],
            sortColumn: "Hard due",
            sortDirection: "desc",
        },
        {
            name: "Active",
            type: "table",
            filter: "-Completion=Done -Completion=Dropped",
            columns: [
                "Parents",
                "basename",
                "Hr completed",
                "Completion",
                "Target start",
                "Target due",
                "Hard due",
                "Priority",
                "Term",
                "Categories",
            ],
            sortColumn: "Hard due",
            sortDirection: "asc",
        },
        {
            name: "View",
            type: "cards",
            columns: ["Priority", "Completion", "Term", "Categories"],
        },
        {
            name: "List",
            type: "list",
            leafOnly: true,
            filter: "archive=false -Completion=Done -Completion=Dropped",
            sortColumn: "Hard due",
            sortDirection: "asc",
        },
        {
            name: "Calendar",
            type: "calendar",
        },
    ],
});
