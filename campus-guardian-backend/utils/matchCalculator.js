/**
 * Practical, rule-based match scoring for Lost & Found items.
 * NOT an AI model - simple keyword/attribute comparison.
 */

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "on",
  "at",
  "with",
  "is",
  "was",
  "my",
  "it",
  "to",
  "for",
]);

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));

const jaccardSimilarity = (setA, setB) => {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * Calculate a match score (0-100) between two LostFound items,
 * along with human-readable reasons for the match.
 *
 * @param {Object} itemA
 * @param {Object} itemB
 * @returns {{ score: Number, reasons: String[] }}
 */
const calculateMatchScore = (itemA, itemB) => {
  let score = 0;
  const reasons = [];

  // 1. Category match - 30 points
  if (itemA.category && itemB.category && itemA.category === itemB.category) {
    score += 30;
    reasons.push("Same category");
  }

  // 2. Item name similarity - up to 20 points
  const nameTokensA = new Set(tokenize(itemA.itemName));
  const nameTokensB = new Set(tokenize(itemB.itemName));
  const nameSimilarity = jaccardSimilarity(nameTokensA, nameTokensB);
  if (nameSimilarity > 0) {
    score += Math.round(nameSimilarity * 20);
    if (nameSimilarity >= 0.4) reasons.push("Similar item name");
  }

  // 3. Description keyword overlap - up to 25 points
  const descTokensA = new Set(tokenize(itemA.description));
  const descTokensB = new Set(tokenize(itemB.description));
  const descSimilarity = jaccardSimilarity(descTokensA, descTokensB);
  if (descSimilarity > 0) {
    score += Math.round(descSimilarity * 25);
    if (descSimilarity >= 0.2) reasons.push("Similar description");
  }

  // 4. Location match - 15 points (exact) or 7 (partial)
  if (itemA.location && itemB.location) {
    const locA = itemA.location.toLowerCase().trim();
    const locB = itemB.location.toLowerCase().trim();
    if (locA === locB) {
      score += 15;
      reasons.push("Same location");
    } else if (locA.includes(locB) || locB.includes(locA)) {
      score += 7;
      reasons.push("Similar location");
    }
  }

  // 5. Date proximity - up to 10 points
  if (itemA.date && itemB.date) {
    const dateA = new Date(itemA.date).getTime();
    const dateB = new Date(itemB.date).getTime();
    const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) {
      score += 10;
      reasons.push("Same date");
    } else if (diffDays <= 7) {
      score += 5;
      reasons.push("Similar date");
    }
  }

  return {
    score: Math.min(Math.round(score), 100),
    reasons,
  };
};

module.exports = calculateMatchScore;
