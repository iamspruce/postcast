"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeScoring = exports.composeTransforms = exports.composeFilters = void 0;
const composeFilters = (...rules) => rules;
exports.composeFilters = composeFilters;
const composeTransforms = (...rules) => rules;
exports.composeTransforms = composeTransforms;
const composeScoring = (...rules) => rules;
exports.composeScoring = composeScoring;
