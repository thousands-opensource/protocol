import React from "react";
import {
    Box,
    Image,
    Text,
    Flex,
    Icon,
    Divider,
    Center,
} from "@chakra-ui/react";
import { FaCalendar, FaCircle } from "react-icons/fa";
import {
    eventCardFlexSx,
    eventCardImageSx,
    eventCardSX,
    eventHostIconSx,
} from "./styles";
import { formatDateString } from "@/utils/eventUtil";
import Token2049EventFooter from "./Token2049EventFooter";

interface EventCardProps {
    imageUrl: string;
    seriesName: string;
    seriesNumber: string;
    date: string;
    description: string;
}

const EventCard: React.FC<EventCardProps> = ({
    imageUrl,
    seriesName,
    seriesNumber,
    date,
    description,
}) => {
    /**
     * Event Preview Card JSX
     */
    const renderPreviewCardDetailsJSX = () => {
        const formattedDate = formatDateString(date);
        return (
            <Box p={4}>
                {/* <Text fontSize="xl" fontWeight="bold" mb={2}>
                    {seriesName} {seriesNumber}
                </Text> */}
                <Flex alignItems="center" mb={2}>
                    <Icon as={FaCalendar} mr={2} color="gray.400" />
                    <Text fontSize="sm" color="gray.400">
                        Date of event - {formattedDate}
                    </Text>
                </Flex>

                <Text fontSize="sm" mb={4} width={["auto", "auto", "45ch"]}>
                    <Text as="span" color="gray.500">
                        {description}
                    </Text>
                </Text>
            </Box>
        );
    };

    /**
     * Event Preview Card Hosts JSX
     */
    const renderPreviewCardHostsJSX = () => {
        // return null;

        return (
            <Flex flexDirection={"row"} py="10px" justifyContent={"center"}>
                <Center>
                    <Divider
                        display={["none", "none", "block"]}
                        orientation="vertical"
                    />
                    <Flex
                        justifyContent="space-between"
                        alignItems="flex-end"
                        flexDirection={"column"}
                        p="10px"
                        gap="15px"
                    >
                        <Image
                            src="/images/thousands-w-icon.svg"
                            h={[
                                "0px",
                                "0px",
                                "100px",
                                "100px",
                                "120px",
                                "120px",
                            ]}
                            w={[
                                "0px",
                                "0px",
                                "100px",
                                "100px",
                                "120px",
                                "120px",
                            ]}
                            alt="thousands w icon"
                            loading="lazy"
                        />
                    </Flex>
                </Center>
            </Flex>
        );
    };

    return (
        <Box sx={eventCardSX}>
            <Image
                src={imageUrl}
                alt={`${seriesName} ${seriesNumber}`}
                sx={eventCardImageSx}
            />
            <Flex sx={eventCardFlexSx}>{renderPreviewCardDetailsJSX()}</Flex>
        </Box>
    );
};

export default EventCard;
