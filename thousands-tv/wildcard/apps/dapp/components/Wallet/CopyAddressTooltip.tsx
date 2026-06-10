// CopyAddressTooltip.tsx
import React, { useState } from "react";
import { Text, Tooltip } from "@chakra-ui/react";
import { copyTextToClipboard, shorten } from "@/utils/util";
import { additionalWalletTextSx } from "@/features/Wildfile/WildFileProfile/Main/ConnectedWallets/styles";

export interface CopyAddressTooltipProps {
    /** The address to display. */
    address?: string;
    /**
     * Callback when the tooltip is closed.
     * Receives a new tooltip text (e.g. resetting to "Copy").
     */
    onClose?: (text: string) => void;
}

const CopyAddressTooltip: React.FC<CopyAddressTooltipProps> = ({
    address,
    onClose,
}) => {
    const [toolTipText, setToolTipText] = useState<string>("Copy");

    if (!address) {
        return <Text>No address found</Text>;
    }

    return (
        <Tooltip
            label={toolTipText}
            placement="top"
            hasArrow
            closeDelay={500}
            onClose={() => onClose?.("Copy")}
        >
            <Text
                onClick={() => copyTextToClipboard(address, setToolTipText)}

                sx={additionalWalletTextSx}
            >
                {shorten(address, { isAddress: true })}
            </Text>
        </Tooltip>
    );
};

export default CopyAddressTooltip;
