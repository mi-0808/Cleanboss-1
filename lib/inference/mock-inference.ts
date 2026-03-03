import type { ItemCode, ItemResult } from '../rules/types';

const thresholds: Record<ItemCode, number> = {
  hair: 0.7,
  zipper: 0.7,
  buttons: 0.7,
  glove_gap: 0.7
};

export function runMockInference(): ItemResult[] {
  const items: ItemCode[] = ['hair', 'zipper', 'buttons', 'glove_gap'];

  return items.map((itemCode) => {
    const score = Math.random();
    const threshold = thresholds[itemCode];
    const ng = score < threshold;

    return {
      itemCode,
      score,
      threshold,
      result: ng ? 'NG' : 'OK',
      reasonCode: ng ? `${itemCode}_LOW_CONFIDENCE` : undefined
    };
  });
}
