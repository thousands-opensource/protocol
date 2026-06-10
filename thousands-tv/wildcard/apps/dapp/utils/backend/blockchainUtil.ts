import {
    FALLBACK_GAS_STATION_URL,
    MUMBAI_GAS_STATION_URLS,
    PROD_GAS_STATION_URLS,
} from "@/constants/constants";
import {
    isConduitEnvironment,
    isLocalEnvironment,
    isProdEnvironment,
} from "@/utils/environmentUtil";
import { GasPrice } from "@repo/interfaces";
import axios from "axios";
import { ethers, BigNumber } from "ethers";

/**
 * @returns The current gas price from the gas station API
 */
export async function getGasPrice(): Promise<GasPrice> {
    // default to 200/100 gwei
    const maxFeePerGas = BigNumber.from(200000000000);
    const maxPriorityFeePerGas = BigNumber.from(100000000000);

    // use the defaults for the local environment
    if (isLocalEnvironment() || isConduitEnvironment()) {
        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    }

    const gasStationUrls = isProdEnvironment()
        ? PROD_GAS_STATION_URLS
        : MUMBAI_GAS_STATION_URLS;

    // go through the gas stations until we find one that works
    for (const gasStationUrl of gasStationUrls) {
        try {
            const { data } = await axios({
                method: "get",
                url: gasStationUrl,
            });

            // maxFeePerGas
            let mfpg;
            // maxPriorityFeePerGas
            let mpfpg;
            if (gasStationUrl === FALLBACK_GAS_STATION_URL) {
                // the fallback gas station has a different format for the response
                mfpg = Math.ceil(data.result.FastGasPrice);
                mpfpg = Math.ceil(
                    Number(data.result.FastGasPrice) -
                        Number(data.result.suggestBaseFee)
                );
            } else {
                mfpg = Math.ceil(data.fast.maxFee);
                mpfpg = Math.ceil(data.fast.maxPriorityFee);
            }

            if (Number.isNaN(mfpg) || Number.isNaN(mpfpg)) {
                console.error(
                    `Failed to parse gas prices from URL: ${gasStationUrl}, maxFeePerGas: ${mfpg}, maxPriorityFeePerGas: ${mpfpg}`
                );
                continue;
            }

            const mfpgBN = ethers.utils.parseUnits(`${mfpg}`, "gwei");
            const mpfpgBN = ethers.utils.parseUnits(`${mpfpg}`, "gwei");
            return {
                maxFeePerGas: mfpgBN,
                maxPriorityFeePerGas: mpfpgBN,
            };
        } catch (e) {
            console.error(
                `Failed to fetch gas price from station '${gasStationUrl}'`,
                e
            );
        }
    }

    // return the defaults as a last fallback
    return {
        maxFeePerGas,
        maxPriorityFeePerGas,
    };
}
