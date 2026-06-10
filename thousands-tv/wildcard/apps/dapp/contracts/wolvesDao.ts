import { getWolvesDaoAddress } from "@/utils/environmentUtil";
import { BigNumber, Contract } from "ethers";
import { Signer, Provider } from "@wagmi/core";
import WolvesDao from "./abi/wolvesDao.json";

export const WOLVES_DAO_ADDRESS = getWolvesDaoAddress();
if (!WOLVES_DAO_ADDRESS) {
    console.warn(
        "Address of Wolves Dao contract not found. Run 'npm run deploy' or set WOLVES_DAO_ADDRESS environment variable to the deployed contract address"
    );
} else {
    console.log(`Using Wolves Dao contract address: ${WOLVES_DAO_ADDRESS}`);
}

export class WolvesDaoContract {
    contract: Contract;

    constructor(signerOrProvider?: Signer | Provider) {
        this.contract = new Contract(
            WOLVES_DAO_ADDRESS,
            WolvesDao,
            signerOrProvider
        );
    }

    async isOwner(address: string): Promise<boolean> {
        try {
            const balance: BigNumber = await this.contract.balanceOf(address);

            return balance.gt(BigNumber.from(0));
        } catch (e) {
            const err = `Failed to get WolvesDao balanceOf for ${address}`;
            console.error(err, e);
            return false;
        }
    }
}
