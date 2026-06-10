import { Wallet, ethers } from "ethers";
import { getPrivateKey, getRpcProvider } from "./environmentUtil";
// private key to interace with blockchain
const PRIVATE_KEY = getPrivateKey();
if (!PRIVATE_KEY) {
    console.error("PRIVATE_KEY env var not set");
}

// provider to user for blockchain contracts contracts
export const PROVIDER = ethers.getDefaultProvider(getRpcProvider());
export const WALLET = new Wallet(PRIVATE_KEY, PROVIDER);
