"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickTopN = pickTopN;
function pickTopN(items, limit) {
    return [...items]
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
