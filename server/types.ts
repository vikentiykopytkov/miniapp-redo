export type Tier = 0 | 1 | 2 | 3; // 0=free, 1=200, 2=1500, 3=15000
export const TIER_STAKES: Record<Tier, number> = {
0: 0,
1: 200,
2: 1500,
3: 15000
};
export const TARGET_RTP = 0.5; // Выплаты = 50% от ставок