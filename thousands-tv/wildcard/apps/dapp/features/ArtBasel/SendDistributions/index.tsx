import { THEME_COLOR_BG_PRIMARY } from "@/constants";
import { Box, Button, Text, VStack, Code, useToast } from "@chakra-ui/react";
import React from "react";
import { useContractWrite, usePrepareContractWrite } from "wagmi";
import ArtBaselDistributorJson from "../abi/ArtBaselDistributor.json";
import {
    ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS,
    ArtBaselDistribution,
    LIZ_COIN_ADDRESS,
    USDC_TOKEN_ADDRESS,
} from "@/features/ArtBasel";
import Link from "next/link";
import { getBaseScanUrl } from "@/features/ArtBasel/util";
import { parseUnits, formatUnits } from "ethers/lib/utils";

interface TransactionGroupProps {
    recipients: string[];
    amounts: BigInt[];
    group: ArtBaselDistribution[];
    index: number;
}

interface SendDistributionsProps {
    distributions: ArtBaselDistribution[];
}

const GROUP_SIZE = 50;

// Main component
const SendDistributions: React.FC<SendDistributionsProps> = ({
    distributions,
}) => {
    const toast = useToast();

    const batchTransactions = (
        data: ArtBaselDistribution[],
        size: number
    ): ArtBaselDistribution[][] => {
        const batches: ArtBaselDistribution[][] = [];
        for (let i = 0; i < data.length; i += size) {
            batches.push(data.slice(i, i + size));
        }
        return batches;
    };

    const transactionGroups: ArtBaselDistribution[][] = batchTransactions(
        distributions,
        GROUP_SIZE
    );

    return (
        <Box
            minW="50vw"
            p="4"
            bg={THEME_COLOR_BG_PRIMARY}
            color="white"
            borderRadius="md"
        >
            <VStack spacing={6}>
                <Text fontSize="xl" fontWeight="bold">
                    Recipient Chunks
                </Text>
                {transactionGroups.length === 0 ? (
                    <Text fontSize="lg" color="gray.300">
                        No distribution groups have been provided yet.
                    </Text>
                ) : (
                    transactionGroups.map((group, index) => (
                        <TransactionGroup
                            key={index}
                            index={index}
                            group={group}
                            recipients={group.map((item) => item.primaryWallet)}
                            amounts={group.map((item) => item.amount)}
                        />
                    ))
                )}
            </VStack>
        </Box>
    );
};

// Component to represent a single group of transactions
const TransactionGroup: React.FC<TransactionGroupProps> = ({
    recipients,
    amounts,
    group,
    index,
}) => {
    console.log(`Amount for group ${index}:`, amounts);
    const amountsBN = amounts.map((amount) =>
        parseUnits(formatUnits(amount.toString(), 18), 18)
    );
    // console.log(`AmountsBN for group ${index}:`, amountsBN);
    const { config, error: prepareError } = usePrepareContractWrite({
        address: ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS,
        abi: ArtBaselDistributorJson.abi,
        functionName: "distributeTokens",
        args: [LIZ_COIN_ADDRESS, recipients, amountsBN],
    });

    const { write, data, isLoading, isSuccess, error } =
        useContractWrite(config);

    console.log(`Write for group ${index}:`, write);
    console.error(`Prepare error ${index}:`, prepareError);
    console.log(`error for group ${index}:`, JSON.stringify(error));

    function renderGroup() {
        const groupFormatted = group.map((item) => ({
            ...item,
            amount: formatUnits(item.amount.toString(), 18),
        }));
        return <Text>{JSON.stringify(groupFormatted, null, 4)}</Text>;
    }

    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            p="4"
            mb="4"
            bg={THEME_COLOR_BG_PRIMARY}
            color="white"
            width="100%"
        >
            <Text fontWeight="bold" mb="2">
                Distribution Group #{index + 1} ({group.length} wallets)
            </Text>
            <Code
                display="block"
                whiteSpace="pre-wrap"
                bg="gray.900"
                p="2"
                borderRadius="md"
                color="whiteAlpha.900"
                mb="4"
                textAlign="left"
            >
                {renderGroup()}
            </Code>
            <Button
                colorScheme="blue"
                disabled={!write || isLoading}
                onClick={() => write?.()}
            >
                Distribute LIZ
            </Button>
            {isLoading && <Text>Sending distribution...</Text>}
            {isSuccess && (
                <Text py={"10px"}>
                    Success!{" "}
                    <Link target="_blank" href={getBaseScanUrl(data?.hash)}>
                        View Txn {data?.hash}
                    </Link>
                </Text>
            )}
            {error && <Text>Error: {error.message}</Text>}
        </Box>
    );
};

export default SendDistributions;
