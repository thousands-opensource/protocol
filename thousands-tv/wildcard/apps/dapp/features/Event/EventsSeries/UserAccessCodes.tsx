import React from "react";
import {
    Box,
    VStack,
    Text,
    Spinner,
    Badge,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
} from "@chakra-ui/react";

import { IAccessCode } from "@repo/interfaces";

interface UserAccessCodesProps {
    accessCodes: IAccessCode[];
    isLoading: boolean;
    error: string | null;
    userId: string;
}

/**
 * Dev Tool to generate access codes for an event
 */
const UserAccessCodes: React.FC<UserAccessCodesProps> = ({
    accessCodes,
    isLoading,
}: UserAccessCodesProps) => {
    if (isLoading) return <Spinner />;
    if (accessCodes?.length === 0) return;

    return (
        <Box mt="20px">
            <Text fontSize="xl" fontWeight="bold" mb={4} ml="30px">
                Your Access Codes
            </Text>
            <Accordion allowMultiple>
                {accessCodes?.map((code) => (
                    <AccordionItem key={code._id?.toString()}>
                        <h2>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    {code?.accessCode}
                                </Box>
                                <Badge
                                    colorScheme={
                                        code.isClaimed ? "green" : "blue"
                                    }
                                    mr={2}
                                >
                                    {code.isClaimed ? "Claimed" : "Available"}
                                </Badge>
                                <AccordionIcon />
                            </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                            <VStack align="start" spacing={2}>
                                <Text>
                                    <strong>Type:</strong> {code.codeType}
                                </Text>
                                <Text>
                                    <strong>Tier:</strong> {code.tier}
                                </Text>
                                <Text>
                                    <strong>Max Quantity:</strong>{" "}
                                    {code.maxQuantity}
                                </Text>
                                <Text>
                                    <strong>Used:</strong>{" "}
                                    {code.claimedUsers.length} /{" "}
                                    {code.maxQuantity}
                                </Text>
                                {code.seriesId && (
                                    <Text>
                                        <strong>Season ID:</strong>{" "}
                                        {code.seriesId.toString()}
                                    </Text>
                                )}
                                {code.claimedUsers.length > 0 && (
                                    <Box>
                                        <Text>
                                            <strong>Claimed By:</strong>
                                        </Text>
                                        <VStack align="start" pl={4}>
                                            {code.claimedUsers.map(
                                                (user, index) => (
                                                    <Text key={index}>
                                                        User ID:{" "}
                                                        {user.claimedBy.toString()}
                                                        {user.claimedCodeEventId &&
                                                            ` (Event: ${user.claimedCodeEventId})`}
                                                    </Text>
                                                )
                                            )}
                                        </VStack>
                                    </Box>
                                )}
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
        </Box>
    );
};

export default UserAccessCodes;
