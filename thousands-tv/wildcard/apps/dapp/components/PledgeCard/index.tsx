import { THEME_COLOR_DARK_ONYX } from "@/constants/constants";
import { Text, Image, Card, Stack, CardBody, Flex } from "@chakra-ui/react";
import { ActionTemplate } from "../PubNub/Chat/ActionTemplate";

interface PledgeCardProps {
    actionTemplate: ActionTemplate;
}

const PledgeCard = ({ actionTemplate }: PledgeCardProps) => {
    const { type, text, actionLabel } = actionTemplate;

    return (
        <Card
            direction={"row"}
            variant="outline"
            backgroundColor={THEME_COLOR_DARK_ONYX}
            maxW={"265px"}
            position="relative"
        >
            <Image
                objectFit="contain"
                maxH="60px"
                maxW="60px"
                src={"/images/goalieko.png"}
                alt="cheer"
            />

            <Stack w={"205px"}>
                <CardBody py={0} px={"0px"} h="100%">
                    <Flex
                        sx={{
                            flexDirection: "row",
                            w: "100%",
                            h: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            align={"center"}
                            fontSize={"14px"}
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "pre-wrap",
                            }}
                        >{`${text}`}</Text>
                    </Flex>
                </CardBody>
            </Stack>
        </Card>
    );
};

export default PledgeCard;
