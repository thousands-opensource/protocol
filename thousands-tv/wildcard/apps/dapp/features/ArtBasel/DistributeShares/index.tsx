import { useGlobalContext } from "@/contexts/globalContext";
import { getOwnersForContract } from "@/utils/backend/alchemyUtil";
import { getNumberOfFullSpectrumSets } from "@/utils/util";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Text,
    Textarea,
    useToast,
    VStack,
} from "@chakra-ui/react";
import {
    Alchemy,
    BigNumber,
    Network,
    NftContractOwner,
    NftContractTokenBalance,
} from "alchemy-sdk";
import React, { Dispatch, SetStateAction, useState } from "react";
import { ArtBaselDistribution } from "..";
import { THEME_COLOR_THOUSANDS } from "@/constants";

interface WalletData {
    primaryWallet: string;
    additionalWallets: string[];
}
interface ApiWalletResponse {
    Wallets: {
        WalletAddress: string;
        AdditionalWalletAddresses: string[] | null;
    }[];
}
interface Props {
    setDistributions: Dispatch<SetStateAction<ArtBaselDistribution[]>>;
    distributeAmountFormatted: string;
}

const DistributeShares: React.FC<Props> = ({
    setDistributions,
    distributeAmountFormatted,
}) => {
    const { setLoadingSpinner } = useGlobalContext();
    const [totalShares, setTotalShares] = useState(0);
    const [jsonInput, setJsonInput] = useState("");
    const [walletData, setWalletData] = useState<WalletData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const toast = useToast();

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
        if (e.target.value.trim()) {
            try {
                const transformed = validateAndParseJson(e.target.value);
                setWalletData(transformed);
                setError(null);
                toast({
                    title: "JSON Parsed Successfully",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Invalid JSON format"
                );
                setWalletData([]);
            }
        } else {
            setError(null);
            setWalletData([]);
        }
    };

    const validateAndParseJson = (input: string): WalletData[] => {
        try {
            const parsed = JSON.parse(input) as ApiWalletResponse;

            // Check if the input has Wallets property and it's an array
            if (!parsed.Wallets || !Array.isArray(parsed.Wallets)) {
                throw new Error("Input must have a Wallets array");
            }

            // Transform the data into WalletData format
            const transformedData = parsed.Wallets.map((wallet) => ({
                primaryWallet: wallet.WalletAddress,
                additionalWallets: wallet.AdditionalWalletAddresses || [],
            }));

            // Validate each transformed object
            const isValid = transformedData.every((item) => {
                return (
                    typeof item.primaryWallet === "string" &&
                    Array.isArray(item.additionalWallets) &&
                    item.additionalWallets.every(
                        (wallet) => typeof wallet === "string"
                    )
                );
            });

            if (!isValid) {
                throw new Error("Invalid wallet address format");
            }

            return transformedData;
        } catch (err) {
            throw new Error(
                err instanceof Error ? err.message : "Invalid JSON format"
            );
        }
    };

    const calculateShares = async () => {
        setLoadingSpinner(true);

        let totalShares = 0;
        const addressToShares = new Map<string, number>();

        // get wildpass owners
        /*
        const alchemyPolygonSettings = {
            apiKey: "",
            network: Network.MATIC_MAINNET,
        };
        const polyAlchemy = new Alchemy(alchemyPolygonSettings);
        const WILDPASS_CONTRACT_ADDRESS =
            "0xef41141fbc0a7c870f30fee81c6214582dc2a494";

        const wildpassOwners: NftContractOwner[] = await getOwnersForContract(
            polyAlchemy,
            WILDPASS_CONTRACT_ADDRESS
        );
        console.log("wildpassOwners", wildpassOwners);
        */
        // const sorted = wildpassOwners.sort((a, b) =>
        //     a.tokenBalances.length > b.tokenBalances.length ? -1 : 1
        // );
        // console.log("sorted", sorted);

        // process shares for each user
        for (const user of walletData) {
            // const userWallets = [
            //     user.primaryWallet.toLowerCase(),
            //     ...user.additionalWallets.map((wallet: string) =>
            //         wallet.toLowerCase()
            //     ),
            // ];

            // // get all token balances for the user
            // const userTokenBalances: NftContractTokenBalance[] = [];
            // for (const owner of wildpassOwners) {
            //     if (userWallets.includes(owner.ownerAddress.toLowerCase())) {
            //         userTokenBalances.push(...owner.tokenBalances);
            //     }
            // }
            // // calculate the amount of shares for the user
            // const numFullSpectrums =
            //     getNumberOfFullSpectrumSets(userTokenBalances);
            // let numShares = 1 + userTokenBalances.length + numFullSpectrums;

            // totalShares += numShares;
            // addressToShares.set(user.primaryWallet, numShares);

            addressToShares.set(user.primaryWallet, 1);
            totalShares += 1;
        }

        setLoadingSpinner(false);

        console.log({ addressToShares, totalShares });
        // Convert Map entries to ArtBaselDistribution array
        const distributions: ArtBaselDistribution[] = Array.from(
            addressToShares.entries()
        ).map(([address, shares]) => ({
            primaryWallet: address,
            amount:
                (BigInt(distributeAmountFormatted) * BigInt(1e18)) /
                BigInt(totalShares),
            totalShares: shares,
        }));

        setDistributions(distributions);
        setTotalShares(totalShares);
        console.log(distributions);
    };

    return (
        <Box minW={"50vw"}>
            <VStack gap={4} width={"100%"} rowGap={4}>
                <FormControl>
                    <FormLabel>Recipients:</FormLabel>
                    <Textarea
                        value={jsonInput}
                        onChange={handleInputChange}
                        placeholder='{
    "Wallets": [
        {
            "WalletAddress": "0x8287fa6dbf76930D320272798c1770bc4d12eBe3",
            "AdditionalWalletAddresses": null
        },
        {
            "WalletAddress": "0x11fFe03DdbeE674463B7e06EcF973415944706A1",
            "AdditionalWalletAddresses": [
                "0x1509ee6DC3F18379aCC47Ab7D349FC1913d2342c"
            ]
        }
    ]
}'
                        size="lg"
                        fontFamily="mono"
                        h="32"
                    />
                </FormControl>
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {walletData.length > 0 && (
                    <VStack spacing={4} align="stretch" mt={2}>
                        <Alert status="success">
                            <AlertIcon />
                            <AlertDescription>
                                Valid JSON format
                            </AlertDescription>
                        </Alert>
                    </VStack>
                )}
                <Button
                    onClick={calculateShares}
                    isDisabled={!walletData.length}
                >
                    {" "}
                    Calculate Shares
                </Button>
            </VStack>
            {totalShares > 0 && (
                <Text mt={4} color={THEME_COLOR_THOUSANDS}>
                    Total Shares: {totalShares}
                </Text>
            )}
        </Box>
    );
};

export default DistributeShares;
