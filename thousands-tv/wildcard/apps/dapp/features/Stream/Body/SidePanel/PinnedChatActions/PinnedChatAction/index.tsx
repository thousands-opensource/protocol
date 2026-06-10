import { THEME_COLOR_DARK_ONYX } from "@/constants/constants";
import {
    Image,
    Text,
    Card,
    Stack,
    CardBody,
    Button,
    Flex,
} from "@chakra-ui/react";

interface PinnedChatActionProps {
    pca: any;
}

const PinnedChatAction = ({ pca }: PinnedChatActionProps) => {
    const { eventId, actionLabel, text, icon, type } = pca;

    const renderActions = () => {
        if (type === "system-yesno") {
            return (
                <Flex
                    sx={{
                        width: "100%",
                    }}
                >
                    <Flex
                        sx={{
                            flexDirection: "column",
                        }}
                    >
                        <Text fontSize={"xx-small"}>{actionLabel}</Text>
                        <Text fontSize={"xx-small"}>
                            {"Who are you cheering for"}
                        </Text>
                    </Flex>
                    <Flex sx={{ width: "100%", flexDirection: "row" }}>
                        <Button
                            sx={{
                                height: "var(--chakra-sizes-4)",
                                maxW: "var(--chakra-sizes-4)",
                                borderColor: "#5D5D5D",
                            }}
                            fontSize={"xx-small"}
                            variant="outline"
                        >
                            Yes
                        </Button>
                        <Button
                            sx={{
                                height: "var(--chakra-sizes-4)",
                                maxW: "var(--chakra-sizes-4)",
                                borderColor: "#5D5D5D",
                            }}
                            fontSize={"xx-small"}
                            variant="outline"
                        >
                            No
                        </Button>
                    </Flex>
                </Flex>
            );
        } else if (type === "system-join") {
            return (
                <>
                    <Button
                        sx={{
                            height: "var(--chakra-sizes-4)",
                            maxW: "var(--chakra-sizes-4)",
                            borderColor: "#5D5D5D",
                        }}
                        fontSize={"xx-small"}
                        variant="outline"
                    >
                        Join
                    </Button>
                </>
            );
        }
    };

    return (
        <Card
            direction={{ base: "column", sm: "row" }}
            overflow="hidden"
            variant="outline"
            w={"100%"}
            sx={{
                "&:last-child": {
                    marginRight: "-30%",
                },
            }}
        >
            <Image
                objectFit="contain"
                maxH={"40px"}
                src={icon}
                alt="Caffe Latte"
                loading="lazy"
            />

            <Stack w={"100%"}>
                <CardBody
                    py={0}
                    px={"0px"}
                    alignItems={"center"}
                    textAlign="center"
                    backgroundColor={THEME_COLOR_DARK_ONYX}
                >
                    {renderActions()}
                </CardBody>
            </Stack>
        </Card>
    );
};

export default PinnedChatAction;
