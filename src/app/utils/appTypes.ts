export interface Profile {
  public_key: string;
  ranking: number;
  imbalance: number;
  locale?: string;
  view_id?: string;
  height?: number;
  error?: string;
}

export interface GraphNode {
  id: number;
  label: string;
  locale?: string;
  localeIndex?: number;
  group?: number;
  neighbors?: GraphNode[];
  links?: GraphLink[];
  pubkey: string;
  ranking: number;
}

export interface GraphLink {
  source: number;
  target: number;
  value: number;
}

export interface ViewHeader {
  previous: string;
  hash_list_root: string;
  time: number;
  target: string;
  point_work: string;
  nonce: number;
  height: number;
  consideration_count: number;
}

export interface ViewIdHeaderPair {
  view_id: string;
  header: ViewHeader;
}

export interface View {
  header: ViewHeader;
  considerations: Consideration[];
}

export interface Consideration {
  time: number;
  nonce?: number;
  by?: string;
  for: string;
  memo: string;
  series?: number;
  signature?: string;
}
