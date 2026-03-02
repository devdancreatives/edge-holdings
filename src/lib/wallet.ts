import { ethers } from "ethers";
import * as bip39 from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import { keccak256 } from "js-sha3";
import bs58 from "bs58";
import { createHash } from "crypto";

const bip32 = BIP32Factory(ecc);

export const generateMnemonic = () => {
  return bip39.generateMnemonic();
};

const sha256 = (buffer: Buffer) => {
  return createHash("sha256").update(buffer).digest();
};

export const getTronAddress = async (
  mnemonic: string,
  index: number,
): Promise<{ address: string; path: string }> => {
  if (!mnemonic) throw new Error("Mnemonic is required");

  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);

  // TRON path: m/44'/195'/0'/0/index
  const path = `m/44'/195'/0'/0/${index}`;
  const child = root.derivePath(path);

  if (!child.privateKey) throw new Error("No private key derived");

  // Get public key (uncompressed, omit first byte 0x04)
  const pubKey = ecc.pointFromScalar(child.privateKey, false);
  if (!pubKey) throw new Error("Invalid public key");

  const pubKeyBytes = pubKey.slice(1); // remove 04 prefix
  const keccakHash = keccak256(pubKeyBytes); // hex string

  const addressHex = "41" + keccakHash.slice(-40); // last 20 bytes (40 hex chars)

  // Base58Check encoding
  const addressBytes = Buffer.from(addressHex, "hex");
  const checksum = sha256(sha256(addressBytes)).slice(0, 4);

  const finalBytes = Buffer.concat([addressBytes, checksum]);
  const address = bs58.encode(finalBytes);

  return { address, path };
};

export const getBscAddress = async (
  mnemonic: string,
  index: number,
): Promise<{ address: string; privateKey: string; path: string }> => {
  if (!mnemonic) throw new Error("Mnemonic is required");

  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);

  // BSC/ETH path: m/44'/60'/0'/0/index
  const path = `m/44'/60'/0'/0/${index}`;
  const child = root.derivePath(path);

  if (!child.privateKey) throw new Error("No private key derived");

  const wallet = new ethers.Wallet(
    Buffer.from(child.privateKey).toString("hex"),
  );

  return { address: wallet.address, privateKey: wallet.privateKey, path };
};
