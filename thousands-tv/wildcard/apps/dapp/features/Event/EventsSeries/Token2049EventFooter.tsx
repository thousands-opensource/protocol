import {
    Box,
    Flex,
    Divider,
    Image,
    Text,
    SystemStyleObject,
} from "@chakra-ui/react";

interface Token2049EventFooterProps {
    sx?: SystemStyleObject;
}

const Token2049EventFooter = ({ sx }: Token2049EventFooterProps) => {
    return (
        <Flex w={"100%"} p={[3, 4, 4, 3, 4, 4]} sx={sx} alignItems={"center"}>
            <Box w="auto">
                <Image
                    src="/images/thousands-token-2049-event.svg"
                    w={["100%", "100%", "100%", "160px", "165px", "165px"]}
                    objectFit={"contain"}
                    alt="Thousand Token 2049 logo"
                    loading="lazy"
                />
            </Box>
            <Divider
                orientation="vertical"
                height={["30px", "50px", "55px", "35px", "35px", "35px"]}
                mx={3}
                borderColor="gray.200"
                transform={"rotate(20deg)"}
            />
            <Text
                textTransform={"uppercase"}
                bgColor={"transparent"}
                ml={[1, 2, 2, 2, 2]}
                fontSize={["14px", "22px", "30px", "14px", "18px", "18px"]}
            >
                Wildcard
            </Text>
        </Flex>
    );
};
export default Token2049EventFooter;
