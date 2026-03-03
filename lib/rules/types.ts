export type ItemCode = 'hair' | 'zipper' | 'buttons' | 'glove_gap';

export type ItemResult = {
  itemCode: ItemCode;
  score: number;
  threshold: number;
  result: 'OK' | 'NG' | 'UNKNOWN';
  reasonCode?: string;
};

export type OverallResult = 'OK' | 'NG' | 'ERROR';
