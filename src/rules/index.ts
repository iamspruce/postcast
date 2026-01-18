import { FilterRule, TransformRule, ScoreRule } from "./engine/ruleTypes";
import { ExtractedArticle } from "../extract/types";
import { CleanContext } from "./types";

import { rejectDomainMismatch } from "./filters/rejectDomainMismatch";
import { rejectNonEnglish } from "./filters/rejectNonEnglish";
import { wordCountRange } from "./filters/wordCountRange";
import { minHeadings } from "./filters/minHeadings";
import { rejectPromos } from "./filters/rejectPromos";
import { rejectTitlePatterns } from "./filters/rejectTitlePatterns";

import { normalizeWhitespace } from "./cleaners/normalizeWhitespace";
import { stripCodeBlocks } from "./cleaners/stripCodeBlocks";
import { stripUrls } from "./cleaners/stripUrls";
import { removeBoilerplate } from "./cleaners/removeBoilerplate";
import { handleLists } from "./cleaners/handleLists";
import { handleTables } from "./cleaners/handleTables";
import { symbolToSpeech } from "./cleaners/symbolToSpeech";
import { pronunciationMap } from "./cleaners/pronunciationMap";
import { introOutro } from "./cleaners/introOutro";
import { enforceMaxDuration } from "./cleaners/enforceMaxDuration";
import { stripHtmlTags } from "./cleaners/stripHtmlTags";
import { cleanCss } from "./cleaners/cleanCss";

import { scoreByWordCount } from "./scoring/scoreByWordCount";
import { scoreByFreshness } from "./scoring/scoreByFreshness";
import { scoreByHeadings } from "./scoring/scoreByHeadings";
import { penalizeRoundups } from "./scoring/penalizeRoundups";
import { penalizeTooManyLinks } from "./scoring/penalizeTooManyLinks";

export const filterRules: FilterRule<ExtractedArticle>[] = [
  rejectDomainMismatch(),
  rejectNonEnglish(),
  rejectTitlePatterns(),
  rejectPromos(),
  wordCountRange({ min: 700, max: 2300 }), // ~15 mins @ 155 wpm
  minHeadings({ min: 2 }),
];

export const cleanerRules: TransformRule<CleanContext>[] = [
  normalizeWhitespace(),
  removeBoilerplate(),
  stripCodeBlocks({
    codeBlockReplacement:
      "Code example omitted. Check the article link in the episode description.",
  }),
  stripUrls({ urlReplacement: "Link in description." }),
  handleLists(),
  handleTables(),
  stripHtmlTags(),
  cleanCss(),
  symbolToSpeech(),
  pronunciationMap(),
  enforceMaxDuration({ maxMinutes: 15 }),
  introOutro(),
];

export const scoreRules: ScoreRule<CleanContext>[] = [
  scoreByWordCount(),
  scoreByHeadings(),
  scoreByFreshness({ hours: 48 }),
  penalizeRoundups(),
  penalizeTooManyLinks(),
];
