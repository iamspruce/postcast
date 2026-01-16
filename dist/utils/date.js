"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isoDate = isoDate;
exports.dayStamp = dayStamp;
function isoDate(date = new Date()) {
    return date.toISOString();
}
function dayStamp(date = new Date()) {
    return date.toISOString().slice(0, 10);
}
