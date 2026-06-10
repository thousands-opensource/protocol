import React, { useState } from "react";
import { Flex, Button } from "@chakra-ui/react";
import AwardVouchersModal from "./AwardVouchersModal";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { THEME_COLOR_DARK_GOLDEN_YELLOW } from "@/constants/constants";

interface AwardTicketQueueVouchersProps {}

/**
 * Admin Tool to award access code vouchers to users
 *
 */
const AwardTicketQueueVouchers: React.FC<
    AwardTicketQueueVouchersProps
> = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { onMessage } = useInfoNotifications();

    return (
        <Flex>
            <Button
                mt={"10px"}
                bg={THEME_COLOR_DARK_GOLDEN_YELLOW}
                onClick={() => setIsModalOpen(true)}
                w="full"
            >
                Award Access Code Vouchers
            </Button>
            <AwardVouchersModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onMessage={onMessage}
            />
        </Flex>
    );
};

export default AwardTicketQueueVouchers;
