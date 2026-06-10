import { Flex, Input, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { THEME_COLOR_BG_PRIMARY } from "@/constants";
import DistributeShares from "@/features/ArtBasel/DistributeShares";
import SendDistributions from "@/features/ArtBasel/SendDistributions";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SetApprovalButton from "@/features/ArtBasel/SetApprovalButton";
import { BigNumber } from "alchemy-sdk";

export const ARTBASEL_DISTRIBUTOR_CONTRACT_ADDRESS =
    "0xc938EA81222EB444A8820BCAf87dFCb7202aBFD2";
export const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const LIZ_COIN_ADDRESS = "0xAF4144cd943ed5362Fed2BaE6573184659CBe6FF";

// Art Basel Types
export interface ArtBaselDistribution {
    primaryWallet: string;
    amount: BigInt;
    totalShares: number;
}

const ArtBasel: React.FC = () => {
    const [distributions, setDistributions] = useState<ArtBaselDistribution[]>(
        []
    );
    const [distributeAmountFormatted, setDistributeAmountFormatted] =
        useState<string>("");

    return (
        <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p="20px"
            bg={THEME_COLOR_BG_PRIMARY}
            textAlign="center"
        >
            <Text fontSize="2xl" fontWeight="bold" pt="50px" my="20px">
                Lizard Labs Airdrop
            </Text>
            <ConnectButton />
            <SetApprovalButton />
            <Flex
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                p="20px"
                textAlign="center"
            >
                <Text>Amount of LIZ to distribute:</Text>
                <Input
                    value={distributeAmountFormatted}
                    type="number"
                    onChange={(e) =>
                        setDistributeAmountFormatted(e.target.value)
                    }
                />
            </Flex>
            <DistributeShares
                setDistributions={setDistributions}
                distributeAmountFormatted={distributeAmountFormatted}
            />
            <SendDistributions distributions={distributions} />
        </Flex>
    );
};

export default ArtBasel;
