import React from "react";
import {
    Box,
    Card,
    Flex,
} from "@chakra-ui/react";
import PanelDescription from "../advanced-settings/_ui/panel-description";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import {
    walletCardFlexSX,
    walletCardSX,
} from "@/features/Wildfile/WildFileProfile/Main/ConnectedWallets/styles";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { ProfileTabEnum } from "../..";
import { ManageUserWallets } from "@/components/Wallet/ManageUserWallets";

interface Web3WalletSettingsProps {
    changeTab: (tab: ProfileTabEnum) => void;
}

const Web3WalletSettings = ({ changeTab }: Web3WalletSettingsProps) => {
    const { userDB } = useWildfileUserContext();

    const handleViewPrimaryWallet = () => {
        changeTab(ProfileTabEnum.CONNECTED_ACCOUNTS);
    };

    if (!userDB) {
        return <Box p={4}>Loading...</Box>;
    }

    return (
        <>
            <PanelDescription
                title="Wallet Addresses"
                description={
                    <>
                        <span style={{ color: THEME_COLOR_SECONDARY }}>
                            Link your additional wallets to consolidate all your
                            assets into your Thousands account for display.
                        </span>
                    </>
                }
            >
                <Card flex="1" sx={walletCardSX}>
                    <Box>
                        <Box overflow="hidden">
                            <Flex sx={walletCardFlexSX}>
                                {/* {renderPrimaryLinkedWalletAddress()}
                                {renderAllLinkedWallets()} */}
                                <ManageUserWallets onPrimaryWalletAction={handleViewPrimaryWallet}
                                />
                            </Flex>
                        </Box>
                    </Box>
                </Card>
            </PanelDescription>
        </>
    );
};

export default Web3WalletSettings;
