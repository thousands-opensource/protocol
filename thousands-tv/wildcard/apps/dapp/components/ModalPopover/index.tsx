import React, { ReactNode } from "react";
import {
    Popover,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    IconButton,
} from "@chakra-ui/react";
import * as styles from "./styles";
import { BiInfoSquare } from "react-icons/bi";

interface ModalPopoverProps {
    popoverHeader: ReactNode;
    popoverBody: ReactNode;
    ariaLabel?: string;
}

/**
 * Renders a Popover Dialogue Component
 */
function ModalPopover({
    popoverHeader,
    popoverBody,
    ariaLabel = "info",
}: ModalPopoverProps) {
    return (
        <div id="modalpopover">
            <Popover placement="bottom-end" trigger="click">
                <PopoverTrigger>
                    <IconButton
                        aria-label={ariaLabel}
                        icon={<BiInfoSquare />}
                        sx={styles.popoverIconButtonSx}
                    />
                </PopoverTrigger>
                <PopoverContent sx={styles.popoverContentSx}>
                    <PopoverCloseButton />
                    <PopoverHeader>{popoverHeader}</PopoverHeader>
                    <PopoverBody>{popoverBody}</PopoverBody>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export default ModalPopover;
