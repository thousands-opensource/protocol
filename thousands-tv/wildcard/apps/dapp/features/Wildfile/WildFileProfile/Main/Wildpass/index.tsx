import { Box, Image, Text, BoxProps } from "@chakra-ui/react";
import React from "react";
import WildcardPass from "@/public/images/WildfileAssets/wildcardPass.svg";

interface CollectionsProps extends BoxProps {
    color: string;
    amount: number;
    h?: string;
    w?: string;
}

export const WildPass: React.FC<CollectionsProps> = ({
    color,
    amount,
    h,
    w,
    ...rest
}) => {
    return (
        <Box position="relative" key={color} {...rest}>
            <Image
                alt={"wildpass"}
                src={WildcardPass.src}
                h={h || "40px"}
                maxW={"none"}
                bgColor={color}
                w={w || "60px"}
            />
            <Box
                position="absolute"
                top="-8px"
                display={amount > 1 ? "inherit" : "none"}
                right="-6px"
                bg={`rgba(0, 0, 0, 0.6)`}
                color="white"
                py="1px"
                px="3px"
                borderRadius="md"
                fontSize="sm"
            >
                <Text fontWeight="bold" textTransform={"none"}>
                    x{amount}
                </Text>
            </Box>
        </Box>
    );
};

export default WildPass;
