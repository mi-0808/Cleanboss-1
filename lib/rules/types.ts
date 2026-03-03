export type ItemCode = 'hair' | 'neck_gap' | 'glove_gap';

export type ItemResult = {
  itemCode: ItemCode;
  score: number;
  threshold: number;
  result: 'OK' | 'NG';
  reasonCode?: string;
};

export type OverallResult = 'OK' | 'NG' | 'ERROR';
