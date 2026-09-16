/**
 * Base severity score per category.
 * Higher score = more urgent category by default.
 */
const CATEGORY_SEVERITY = {
  Electricity: 6,
  Water: 6,
  Washroom: 5,
  "Wi-Fi": 3,
  Classroom: 3,
  Furniture: 2,
  Cleanliness: 3,
  Other: 2,
};

/**
 * Calculate a complaint's priority based on its category severity
 * and how many upvotes it has received.
 *
 * @param {String} category - complaint category
 * @param {Number} upvotes - number of upvotes on the complaint
 * @returns {"Low"|"Medium"|"High"|"Critical"}
 */
const calculatePriority = (category, upvotes = 0) => {
  const baseSeverity = CATEGORY_SEVERITY[category] ?? 2;

  // Upvotes add urgency: every 5 upvotes adds 1 point, capped.
  const upvoteBoost = Math.min(Math.floor(upvotes / 5), 6);

  const score = baseSeverity + upvoteBoost;

  if (score >= 10) return "Critical";
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
};

module.exports = calculatePriority;
