import { FilterRule, TransformRule, ScoreRule } from "./ruleTypes";

export const composeFilters = <T>(...rules: FilterRule<T>[]) => rules;
export const composeTransforms = <T>(...rules: TransformRule<T>[]) => rules;
export const composeScoring = <T>(...rules: ScoreRule<T>[]) => rules;
