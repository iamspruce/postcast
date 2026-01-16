"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFilters = runFilters;
exports.runTransforms = runTransforms;
exports.runScoring = runScoring;
async function runFilters(input, rules) {
    let cur = input;
    const notes = [];
    for (const rule of rules) {
        const res = await rule.run(cur);
        if (!res.ok) {
            return { ok: false, reason: `${rule.id}: ${res.reason}`, notes };
        }
        cur = res.data;
        if (res.notes)
            notes.push(...res.notes.map((n) => `${rule.id}: ${n}`));
    }
    return { ok: true, data: cur, notes };
}
async function runTransforms(input, rules) {
    let cur = input;
    const notes = [];
    for (const rule of rules) {
        const res = await rule.run(cur);
        if (!res.ok) {
            notes.push(`${rule.id}: skipped (${res.reason})`);
            continue;
        }
        cur = res.data;
        if (res.notes)
            notes.push(...res.notes.map((n) => `${rule.id}: ${n}`));
    }
    return { data: cur, notes };
}
async function runScoring(input, rules) {
    let total = 0;
    const breakdown = [];
    for (const rule of rules) {
        const delta = await rule.score(input);
        total += delta;
        breakdown.push({ id: rule.id, delta });
    }
    return { total, breakdown };
}
