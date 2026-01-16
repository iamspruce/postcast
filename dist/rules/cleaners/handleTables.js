"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTables = void 0;
/**
 * Rule: handleTables
 * Replaces table-like text with a short note.
 * Why: tables are hard to narrate cleanly.
 * Config: none
 */
const handleTables = () => ({
    id: "handleTables",
    description: "Replaces table-like content with a placeholder",
    async run(input) {
        const lines = input.cleanText.split("\n");
        const out = [];
        let removed = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.includes("|") && trimmed.split("|").length > 3) {
                removed = true;
                continue;
            }
            out.push(line);
        }
        const cleanText = removed
            ? `${out.join("\n")}`.replace(/\n{3,}/g, "\n\n")
            : out.join("\n");
        return {
            ok: true,
            data: {
                ...input,
                cleanText,
                notes: removed ? [...input.notes, "Table removed"] : input.notes,
            },
        };
    },
});
exports.handleTables = handleTables;
