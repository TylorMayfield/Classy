import type { Settlement } from '../types';

export type EligibilityInput = {
  state: string;
  workHistory: string;
  productHistory: string;
  hasProof: boolean;
};

export function evaluateSettlement(settlement: Settlement, profile: EligibilityInput) {
  let score = 45;
  const reasons: string[] = [];

  const normalizedState = profile.state.trim().toLowerCase();
  const normalizedWork = profile.workHistory.trim().toLowerCase();
  const normalizedProduct = profile.productHistory.trim().toLowerCase();
  const combinedHistory = `${normalizedWork} ${normalizedProduct}`.trim();

  if (settlement.stateTags.length) {
    if (normalizedState && settlement.stateTags.some((tag) => tag.toLowerCase() === normalizedState)) {
      score += 30;
      reasons.push('state matches the extracted location requirement.');
    } else if (normalizedState) {
      score -= 30;
      reasons.push('state does not match the extracted location requirement.');
    } else {
      reasons.push('state could matter here, but it has not been provided yet.');
    }
  }

  const matchedKeywords = settlement.keywordTags.filter((tag) => combinedHistory.includes(tag.toLowerCase()));
  if (matchedKeywords.length) {
    score += Math.min(25, matchedKeywords.length * 8);
    reasons.push(`history mentions ${matchedKeywords.slice(0, 3).join(', ')}.`);
  } else if (combinedHistory) {
    score -= 10;
    reasons.push('history does not clearly match the extracted settlement keywords.');
  }

  if (settlement.proofRequired && /yes|required/i.test(settlement.proofRequired)) {
    if (profile.hasProof) {
      score += 10;
      reasons.push('proof is available for a claim that appears to require it.');
    } else {
      score -= 15;
      reasons.push('proof may be required and is not marked available yet.');
    }
  }

  score = Math.max(0, Math.min(100, score));

  let label = 'Possible fit';
  if (score >= 75) {
    label = 'Likely eligible';
  } else if (score < 45) {
    label = 'Needs review';
  }

  const reason =
    reasons[0] ??
    'The settlement text did not expose enough structured detail to make this more than a first-pass screen.';

  return { score, label, reason };
}
