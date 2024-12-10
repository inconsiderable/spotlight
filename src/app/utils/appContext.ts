import { createContext } from 'react';
import {
  View,
  ViewIdHeaderPair,
  Consideration,
  Profile,
} from '../utils/appTypes';

interface AppState {
  publicKeys: string[];
  setPublicKeys: (keys: string[]) => void;
  selectedKeyIndex: number;
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  requestTipHeader: () => void;
  tipHeader?: ViewIdHeaderPair;
  setTipHeader: (tipHeader: ViewIdHeaderPair) => void;
  requestViewByHeight: (height: number) => void;
  requestViewById: (view_id: string) => void;
  currentView?: View | null;
  setCurrentView: (currentView: View) => void;
  genesisView?: View | null;
  setGenesisView: (genesisView: View) => void;
  requestProfile: (publicKeyB64: string) => void;
  profile: (publicKeyB64: string) => Profile | null | undefined;
  requestGraphDOT: (publicKeyB64: string) => void;
  graphDOT: (pubKey: string) => string;
  setGraphDOT: (pubKey: string, graphDOT: string) => void;
  rankingFilter: number;
  setRankingFilter: (rankingFilter: number) => void;
  requestConsideration: (consideration_id: string) => void;
  getConsiderationByID: (
    consideration_id: string,
  ) => Consideration | null | undefined;
  setConsiderationByID: (
    consideration_id: string,
    consideration: Consideration,
  ) => void;
  requestPkConsiderations: (publicKeyB64: string) => void;
  pkConsiderations: (pubKey: string) => Consideration[];
  setPkConsiderations: (
    publicKey: string,
    considerations?: Consideration[] | undefined,
  ) => void;
  pushConsideration: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: number,
  ) => Promise<void>;

  requestPendingConsiderations: (publicKeyB64: string) => void;
  pendingConsiderations: Consideration[];
  setPendingConsiderations: (txns: Consideration[]) => void;
  selectedNode: string;
  setSelectedNode: (node: string) => void;
  colorScheme: 'light' | 'dark';
}

export const AppContext = createContext<AppState>({
  publicKeys: [],
  setPublicKeys: () => {},
  selectedKeyIndex: 0,
  selectedKey: '',
  setSelectedKey: () => {},
  tipHeader: undefined,
  requestTipHeader: () => {},
  setTipHeader: () => {},
  requestViewById: (view_id: string) => {},
  requestViewByHeight: (height: number) => {},
  currentView: undefined,
  setCurrentView: (currentView: View) => {},
  genesisView: undefined,
  setGenesisView: (genesisView: View) => {},
  requestProfile: (publicKeyB64: string) => {},
  profile: () => null,
  requestGraphDOT: (publicKeyB64: string) => {},
  graphDOT: () => '',
  setGraphDOT: (pubKey: string, graphDOT: string) => {},
  rankingFilter: 0,
  setRankingFilter: () => {},
  requestConsideration: (consideration_id: string) => {},
  getConsiderationByID: (consideration_id: string) => null,
  setConsiderationByID: (
    consideration_id: string,
    consideration: Consideration,
  ) => {},
  pkConsiderations: () => [],
  requestPkConsiderations: (publicKeyB64: string) => {},
  setPkConsiderations: () => {},
  requestPendingConsiderations: () => {},
  pendingConsiderations: [],
  setPendingConsiderations: () => {},
  selectedNode: '',
  setSelectedNode: () => {},
  colorScheme: 'light',
  pushConsideration: (
    to: string,
    memo: string,
    passphrase: string,
    selectedKeyIndex: number,
  ) => Promise.resolve(),
});
