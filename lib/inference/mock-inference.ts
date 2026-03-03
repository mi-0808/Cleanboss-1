import type { ItemCode, ItemResult } from '../rules/types';

const thresholds: Record<ItemCode, number> = {
  hair: 0.7,
  neck_gap: 0.7,
  glove_gap: 0.7
};

const reasonMap: Record<ItemCode, string> = {
  hair: '髪の毛が頭巾の外に出ています',
  neck_gap: '首元に隙間（肌の露出）があります',
  glove_gap: '手袋と袖の間に隙間があります'
};

export function runMockInference(): ItemResult[] {
  const items: ItemCode[] = ['hair', 'neck_gap', 'glove_gap'];

  return items.map((itemCode) => {
    const score = Math.random();
    const threshold = thresholds[itemCode];
    const ng = score < threshold;

    return {
      itemCode,
      score,
      threshold,
      result: ng ? 'NG' : 'OK',
      reasonCode: ng ? reasonMap[itemCode] : undefined
    };
  });
}
