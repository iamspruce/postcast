"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info(message, meta) {
        if (meta) {
            console.log(`[info] ${message}`, meta);
        }
        else {
            console.log(`[info] ${message}`);
        }
    },
    warn(message, meta) {
        if (meta) {
            console.warn(`[warn] ${message}`, meta);
        }
        else {
            console.warn(`[warn] ${message}`);
        }
    },
    error(message, meta) {
        if (meta) {
            console.error(`[error] ${message}`, meta);
        }
        else {
            console.error(`[error] ${message}`);
        }
    },
};
