"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countWords = countWords;
exports.estimateMinutes = estimateMinutes;
function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
function estimateMinutes(text, wpm = 155) {
    const words = countWords(text);
    return words / wpm;
}
