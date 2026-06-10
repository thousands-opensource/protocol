import { Mutex } from "async-mutex";

/* This needs to be acquired for EVERY transaction that the bot sends to the chain to prevent race conditions with incrementing the nonce */
export const TXN_MUTEX = new Mutex();
