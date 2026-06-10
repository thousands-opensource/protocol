import React from "react";
import {
    Box,
    Text,
    Flex,
    CircularProgress,
    CircularProgressLabel,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { THEME_COLOR_SECONDARY } from "@/constants";
import { UserTicketQueueData } from "@/pages/api/ticketQueue/getQueuePosition";

interface QueuePositionProps {
    queuePosition: number | null;
    totalInQueue: number | null;
    userTicketQueueData: UserTicketQueueData | null;
}

const QueuePosition: React.FC<QueuePositionProps> = ({
    queuePosition,
    totalInQueue,
    userTicketQueueData,
}) => {
    const { ticketQueue } = userTicketQueueData || {};
    const ticketQueuePoints = ticketQueue?.queuePoints || 0;

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    p={6}
                    boxShadow="lg"
                    color="gray.800"
                    border={"1px solid"}
                    borderColor={THEME_COLOR_SECONDARY}
                >
                    <Flex direction="column" align="center">
                        <CircularProgress
                            value={ticketQueuePoints}
                            size="120px"
                            thickness="8px"
                            color="blue.400"
                        >
                            <CircularProgressLabel color={"white"}>
                                {ticketQueuePoints}x
                            </CircularProgressLabel>
                        </CircularProgress>
                        <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            mt={4}
                            color="white"
                        >
                            {`You're in position ${queuePosition}`}
                        </Text>
                        <Text fontSize="md" color="gray.500">
                            Out of {totalInQueue} in the queue
                        </Text>
                    </Flex>
                </Box>
            </motion.div>
        </>
    );
};

export default QueuePosition;
