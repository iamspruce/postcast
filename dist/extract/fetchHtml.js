"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHtml = fetchHtml;
async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: {
            "user-agent": "podcast-bot/0.1 (+https://example.com)",
        },
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return await res.text();
}
