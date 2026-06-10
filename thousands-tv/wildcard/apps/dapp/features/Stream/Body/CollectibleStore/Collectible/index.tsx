import { useState } from "react";
import { Flex, Box, Text, Button } from "@chakra-ui/react";
import { ICollectible } from "@repo/interfaces";

interface CollectibleProps {
    collectible: ICollectible;
}

const Collectible = ({ collectible }: CollectibleProps) => {
    const { name, icon, cost, quantity } = collectible;
    const [isHover, setIsHover] = useState<boolean>(false);

    return (
        <Flex
            key={collectible?._id?.toString()}
            sx={{
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                w: "100px",
                _hover: {
                    transform: "scale(1.1)",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                },
                h: isHover ? "125px" : "100px",
                bgColor: "rgba(66, 69, 73, .51)",
                borderRadius: "12px",
                cursor: "pointer",
            }}
            onMouseEnter={() => {
                setIsHover(true);
            }}
            onMouseLeave={() => {
                setIsHover(false);
            }}
        >
            <Text
                fontSize={"sm"}
                sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {name}
            </Text>
            <Text fontSize={"xs"}>x{quantity}</Text>
            <Box w={"40px"} fontSize={"2.5rem"} alignSelf={"center"}>
                {icon}
            </Box>
            <Button
                sx={{
                    display: isHover ? "block" : "none",
                    width: "100%",
                    borderTopLeftRadius: "0",
                    borderTopRightRadius: "0",
                    borderBottomLeftRadius: "12px",
                    borderBottomRightRadius: "12px",
                    bgColor: "green",
                    _hover: {
                        opacity: 0.85,
                        bgColor: "green",
                    },
                }}
            >
                {cost} 💎
            </Button>
        </Flex>
    );
};
export default Collectible;
