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
});
