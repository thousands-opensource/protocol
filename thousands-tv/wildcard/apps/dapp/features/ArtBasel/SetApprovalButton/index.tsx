import {
    Box,
    Button,
    Text,
    VStack,
    Code,
    useToast,
    Flex,
    FormControl,
    FormLabel,
    Input,
} from "@chakra-ui/react";
import React, { Dispatch, SetStateAction, useState } from "react";
import {
    useContractWrite,
    usePrepareContractWrite,
    useContractRead,
    useAccount,
} from "wagmi";
import USDCJson from "../abi/USDC.json";
import LizCoinJson from "../abi/LizCoin.json";
import {
    ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS,
    LIZ_COIN_ADDRESS,
    USDC_TOKEN_ADDRESS,
} from "@/features/ArtBasel";
import { getBaseScanUrl } from "@/features/ArtBasel/util";
import Link from "next/link";
import { parseUnits, formatUnits } from "ethers/lib/utils";

// Component to represent a single group of transactions
const SetApprovalButton: React.FC = () => {
    const { address } = useAccount();
    //const approvalAmount = 1_000 * 1e18; // 1,000 LIZ tokens 1_000_000 * 1e18;
    const approvalAmount = parseUnits("1000000", 18);
    const { data } = useContractRead({
        address: LIZ_COIN_ADDRESS,
        abi: LizCoinJson.abi,
        functionName: "allowance",
        args: [address, ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS],
    });

    const { config, error: prepareError } = usePrepareContractWrite({
        address: LIZ_COIN_ADDRESS,
        abi: LizCoinJson.abi,
        functionName: "approve",
        args: [ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS, approvalAmount],
    });

    console.log("Prepare config:", JSON.stringify(config));
    console.error("Prepare error:", prepareError);

    const {
        data: writeData,
        isLoading,
        isSuccess,
        error,
        write,
    } = useContractWrite(config);

    console.log("Write function:", write);

    return (
        <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            py="20px"
            textAlign="center"
        >
            <Text>
                Distributor contract approved to distribute:{" "}
                {Number(data) / 1e18} LIZ
            </Text>
            <Button
                disabled={!write || isLoading || isSuccess}
                onClick={() => write?.()}
            >
                Approve {formatUnits(approvalAmount, 18)} LIZ
            </Button>
            {isLoading && <Text>Sending approval txn...</Text>}
            {isSuccess && (
                <Text>
                    Success!{" "}
                    <Link
                        target="_blank"
                        href={getBaseScanUrl(writeData?.hash)}
                    >
                        View Txn {writeData?.hash}
                    </Link>
                </Text>
            )}
            {error && <Text>Error: {error.message}</Text>}
        </Flex>
    );
};

export default SetApprovalButton;
