import React, { useState } from "react";
import { Flex, Text, Spacer, Icon } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { additionalWalletButtonFlexSX } from "@/features/Wildfile/WildFileProfile/Main/ConnectedWallets/styles";
import LinkWalletModal from "./LinkAdditionalWalletsModal";
import { useGlobalContext } from "@/contexts/globalContext";
import { buttonSizeIconSx } from "@/features/Wildfile/WildFileProfile/WildfileNavigation/Icons/styles";

export interface AdditionalWalletsProps {
    customTrigger?: React.ReactElement;
}

export const ManageLinkedWallets = ({ customTrigger }: AdditionalWalletsProps) => {
    const { setLoadingSpinner } = useGlobalContext();
    const [showModal, setShowModal] = useState<boolean>(false);

    const openModal = async () => {
        setLoadingSpinner(true);
        setShowModal(true);
        setLoadingSpinner(false);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <>
            {customTrigger ? (
                // Clone the provided element and attach the openModal function to its onClick event
                React.cloneElement(customTrigger, { onClick: openModal, style: { cursor: "pointer" } })
            ) : (
                // Default clickable element
                <Flex sx={{ ...additionalWalletButtonFlexSX, cursor: 'pointer' }} flexDirection="row" onClick={openModal}>
                    <Text>Add additional Wallet</Text>
                    <Spacer />
                    <Icon as={FaPlus} color={THEME_COLOR_SECONDARY} sx={buttonSizeIconSx} />
                </Flex>
            )}

            <LinkWalletModal
                showModal={showModal}
                closeModal={closeModal}
            />
        </>
    );
};