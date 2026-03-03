import type { ItemResult, OverallResult } from './types';

export function judgeOverall(itemResults: ItemResult[]): {
  overallResult: OverallResult;
  ngReasons: string[];
} {
  if (itemResults.length === 0) {
    return { overallResult: 'ERROR', ngReasons: ['NO_ITEM_RESULTS'] };
  }

  const ngReasons = itemResults
    .filter((item) => item.result === 'NG')
    .map((item) => item.reasonCode ?? `${item.itemCode}_NG`);

  return {
    overallResult: ngReasons.length > 0 ? 'NG' : 'OK',
    ngReasons
  };
}
