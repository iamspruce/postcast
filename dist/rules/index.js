"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRules = exports.cleanerRules = exports.filterRules = void 0;
const rejectDomainMismatch_1 = require("./filters/rejectDomainMismatch");
const rejectNonEnglish_1 = require("./filters/rejectNonEnglish");
const minWordCount_1 = require("./filters/minWordCount");
const minHeadings_1 = require("./filters/minHeadings");
const rejectPromos_1 = require("./filters/rejectPromos");
const rejectTitlePatterns_1 = require("./filters/rejectTitlePatterns");
const normalizeWhitespace_1 = require("./cleaners/normalizeWhitespace");
const stripCodeBlocks_1 = require("./cleaners/stripCodeBlocks");
const stripUrls_1 = require("./cleaners/stripUrls");
const removeBoilerplate_1 = require("./cleaners/removeBoilerplate");
const handleLists_1 = require("./cleaners/handleLists");
const handleTables_1 = require("./cleaners/handleTables");
const symbolToSpeech_1 = require("./cleaners/symbolToSpeech");
const pronunciationMap_1 = require("./cleaners/pronunciationMap");
const introOutro_1 = require("./cleaners/introOutro");
const enforceMaxDuration_1 = require("./cleaners/enforceMaxDuration");
const scoreByWordCount_1 = require("./scoring/scoreByWordCount");
const scoreByFreshness_1 = require("./scoring/scoreByFreshness");
const scoreByHeadings_1 = require("./scoring/scoreByHeadings");
const penalizeRoundups_1 = require("./scoring/penalizeRoundups");
const penalizeTooManyLinks_1 = require("./scoring/penalizeTooManyLinks");
exports.filterRules = [
    (0, rejectDomainMismatch_1.rejectDomainMismatch)(),
    (0, rejectNonEnglish_1.rejectNonEnglish)(),
    (0, rejectTitlePatterns_1.rejectTitlePatterns)(),
    (0, rejectPromos_1.rejectPromos)(),
    (0, minWordCount_1.minWordCount)({ min: 700 }),
    (0, minHeadings_1.minHeadings)({ min: 2 }),
];
exports.cleanerRules = [
    (0, normalizeWhitespace_1.normalizeWhitespace)(),
    (0, removeBoilerplate_1.removeBoilerplate)(),
    (0, stripCodeBlocks_1.stripCodeBlocks)({
        codeBlockReplacement: "Code example omitted. Check the article link in the episode description.",
    }),
    (0, stripUrls_1.stripUrls)({ urlReplacement: "Link in description." }),
    (0, handleLists_1.handleLists)(),
    (0, handleTables_1.handleTables)(),
    (0, symbolToSpeech_1.symbolToSpeech)(),
    (0, pronunciationMap_1.pronunciationMap)(),
    (0, enforceMaxDuration_1.enforceMaxDuration)({ maxMinutes: 12 }),
    (0, introOutro_1.introOutro)(),
];
exports.scoreRules = [
    (0, scoreByWordCount_1.scoreByWordCount)(),
    (0, scoreByHeadings_1.scoreByHeadings)(),
    (0, scoreByFreshness_1.scoreByFreshness)({ hours: 48 }),
    (0, penalizeRoundups_1.penalizeRoundups)(),
    (0, penalizeTooManyLinks_1.penalizeTooManyLinks)(),
];
