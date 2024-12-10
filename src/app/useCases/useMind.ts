import naclUtil from 'tweetnacl-util';
import nacl from 'tweetnacl';
import * as bip39 from 'bip39';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha2';
import { utf8ToBytes } from '@noble/hashes/utils';
import { sha3_256 } from 'js-sha3';
import { VIEWS_UNTIL_NEW_SERIES } from '../utils/constants';
import { Consideration } from '../utils/appTypes';
import { useContext } from 'react';
import { AppContext } from '../utils/appContext';

window.Buffer = window.Buffer || require('buffer').Buffer;

/**
 * Converts a user-supplied passphrase into a 24-word BIP39 mnemonic
 * using SHA-512 and 256 bits of entropy (first 32 bytes).
 */
function generateMnemonic(passphrase: string): string {
  const hash = sha512(utf8ToBytes(passphrase)); // Returns Uint8Array of 64 bytes
  const entropy = hash.slice(0, 32); // 32 bytes = 256 bits = 24 words
  return bip39.entropyToMnemonic(Buffer.from(entropy).toString('hex'));
}

// Simple HMAC-SHA512 HD key derivation
function deriveHDSeed(
  seed: Uint8Array,
  account: number,
  address: number,
): Uint8Array {
  const label = new TextEncoder().encode('inconsiderable');
  const indexBytes = new Uint8Array([account, address]);
  const input = new Uint8Array([...seed, ...indexBytes]);
  const digest = hmac(sha512, label, input);
  return digest.slice(0, 32); // Ed25519 seeds must be 32 bytes
}

function generateHDKeypair(mnemonic: string, account: number, address: number) {
  const masterSeed = bip39.mnemonicToSeedSync(mnemonic);

  const derivedSeed = deriveHDSeed(
    new Uint8Array(masterSeed),
    account,
    address,
  );
  const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);

  return {
    path: `m/${account}/${address}`,
    publicKey: Buffer.from(keypair.publicKey).toString('base64'),
    privateKey: keypair.secretKey,
  };
}

const getPersonas = async (
  passphrase: string,
  numAccounts: number = 1,
  numAddressesPerAccount: number = 7,
) => {
  const mnemonic = generateMnemonic(passphrase);

  const keypairs = [];

  for (let acct = 0; acct < numAccounts; acct++) {
    for (let addr = 0; addr < numAddressesPerAccount; addr++) {
      keypairs.push(generateHDKeypair(mnemonic, acct, addr));
    }
  }

  return keypairs;
};

export const signConsideration = async (
  to: string,
  memo: string,
  tipHeight: number,
  mindIndex: number,
  passPhrase: string,
) => {
  //Prompt -> Sign -> Forget
  //We never persist the passphrase or private keys in state or anywhere else.
  //Any usage of the private keys must require a user prompt for their passphrase.

  const mind = await getPersonas(passPhrase);

  const keyPair = mind[mindIndex];

  const consideration: Consideration = {
    time: Math.floor(Date.now() / 1000),
    nonce: Math.floor(Math.random() * (2 ** 31 - 1)),
    by: keyPair.publicKey,
    for: to,
    memo,
    series: Math.floor(tipHeight / VIEWS_UNTIL_NEW_SERIES) + 1,
  };

  const tx_hash = sha3_256(JSON.stringify(consideration));

  const tx_byte = new Uint8Array(
    (tx_hash.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16)),
  );

  consideration.signature = naclUtil.encodeBase64(
    nacl.sign.detached(tx_byte, keyPair.privateKey),
  );
  return consideration;
};

const importKeys = async (passPhrase: string, returnedKeyCount: number) => {
  //We can keep the public keys in state
  //But we never persist the passphrase or private keys in state or anywhere else.
  return (await getPersonas(passPhrase, returnedKeyCount)).map(
    (keypair) => keypair.publicKey,
  );
};

export const useMind = () => {
  const {
    publicKeys,
    setPublicKeys,
    selectedKey,
    selectedKeyIndex,
    setSelectedKey,
  } = useContext(AppContext);

  const importMind = async (passphrase: string) => {
    const keys = await importKeys(passphrase, 10);

    setPublicKeys(keys);
  };

  const deleteMind = () => {
    setPublicKeys([]);
  };

  return {
    selectedKey,
    selectedKeyIndex,
    setSelectedKey,
    publicKeys,
    importMind,
    deleteMind,
  };
};
