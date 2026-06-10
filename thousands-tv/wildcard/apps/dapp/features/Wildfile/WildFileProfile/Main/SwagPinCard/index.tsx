import { THEME_COLOR_IRON_GREY } from "@/constants/constants";
import { Box, BoxProps, Text, Tooltip } from "@chakra-ui/react";
import Polygonlogo from "@/public/images/polygon-logo.svg";
import React from "react";

interface SwagPinCardProps extends BoxProps {
    imageUrl: string;
    balanceStr: string;
}

const SwagPinCard: React.FC<SwagPinCardProps> = ({
    imageUrl,
    balanceStr,
    ...rest
}) => {
    const balance = Number(balanceStr);
    const bgColor = imageUrl ? "white" : THEME_COLOR_IRON_GREY;
    const imgSrc = imageUrl || `${Polygonlogo.src}`;
    const tooltipLabel = imageUrl
        ? ""
        : "Unable to get token information at this time.  Please check again later.";
    return (
        <Tooltip label={tooltipLabel}>
            <Box
                w={rest.width || "45px"}
                h={rest.height || "45px"}
                bgColor={bgColor}
                position={"relative"}
                backgroundImage={`url(${imgSrc})`}
                backgroundSize={"contain"}
                backgroundRepeat={"no-repeat"}
                backgroundPosition={"center"}
                borderRadius={"2px"}
            >
                <Box
                    position="absolute"
                    top="-8px"
                    display={balance > 1 ? "inherit" : "none"}
                    right="-8px"
                    bg={`rgba(0, 0, 0, 0.6)`}
                    color="white"
                    py="1px"
                    px="3px"
                    borderRadius="md"
                    fontSize="sm"
                >
                    <Text fontWeight="bold" textTransform={"none"}>
                        x{balance}
                    </Text>
                </Box>
            </Box>
        </Tooltip>
    );
};

export default SwagPinCard;
