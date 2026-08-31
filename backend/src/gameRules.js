export const GAME_RULES = {
  target:    { maxScore: 30000, coinBase: 25, coinRate: 0.012, xpRate: 0.025 },
  collector: { maxScore: 30000, coinBase: 30, coinRate: 0.010, xpRate: 0.024 },
  dodge:     { maxScore: 60000, coinBase: 35, coinRate: 0.008, xpRate: 0.020 },
  reaction:  { maxScore: 5000,  coinBase: 50, coinRate: 0.018, xpRate: 0.035 },
  runner:    { maxScore: 60000, coinBase: 30, coinRate: 0.008, xpRate: 0.022 }
};

export function levelCost(level) {
  return 500 + (level - 1) * 100;
}

export function calculateReward(gameId, submittedScore) {
  const rule = GAME_RULES[gameId];
  if (!rule) throw new Error("Unknown game");
  const score = Math.max(0, Math.min(Math.floor(submittedScore), rule.maxScore));
  const coins = Math.max(rule.coinBase, Math.floor(score * rule.coinRate));
  const xp = Math.max(20, Math.floor(score * rule.xpRate));
  return { score, coins, xp };
}

export function applyXp(user, xp) {
  let level = user.level;
  let currentXp = user.xp + xp;
  while (currentXp >= levelCost(level)) {
    currentXp -= levelCost(level);
    level += 1;
  }
  return { level, xp: currentXp };
}
