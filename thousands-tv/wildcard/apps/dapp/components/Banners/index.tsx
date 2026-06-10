import {
    THEME_COLOR_DARK_GOLD,
    THEME_GRADIENT_GOLD_TWO_TONE,
} from "@/constants/constants";
import { ShowdownEvent } from "@/db/schemas/showdownSchema";
import {
    Box,
    Button,
    Center,
    Container,
    HStack,
    Hide,
    Icon,
    Spacer,
    Text,
    Show,
} from "@chakra-ui/react";
import { IoRadio } from "react-icons/io5";

interface LiveEventsBannerProps {
    currentShowdownEvent: ShowdownEvent;
}

export const LiveEventsBanner = ({
    currentShowdownEvent,
}: LiveEventsBannerProps) => {
    return (
        <Box
            borderBottomWidth="1px"
            bg={THEME_COLOR_DARK_GOLD}
            bgGradient={THEME_GRADIENT_GOLD_TWO_TONE}
            boxShadow={"xl"}
            borderRadius={5}
            w={"100%"}
        >
            <Container py={{ base: "4", md: "3.5" }} maxW={"container.lg"}>
                <HStack>
                    {/* Breakpoint wrapper to hide/show elements past a min/max-width */}
                    {/* Live Events */}
                    <Box>
                        <HStack ml={"5px"}>
                            <Text
                                fontSize={{
                                    base: "md",
                                    md: "md",
                                    sm: "sm",
                                }}
                                textColor={"white"}
                                fontWeight={"bold"}
                                casing={"uppercase"}
                            >
                                Live
                            </Text>
                            <Icon
                                as={IoRadio}
                                fontSize={"2xl"}
                                color={"white"}
                            />
                        </HStack>
                    </Box>
                    <Spacer />
                    {/* Description of live events */}
                    <Center>
                        <Box>
                            <Text
                                textColor={"white"}
                                textAlign={"center"}
                                fontSize={{
                                    base: "md",
                                    md: "md",
                                    sm: "sm",
                                }}
                                fontWeight={"bold"}
                                casing={"uppercase"}
                            >
                                {currentShowdownEvent.description}
                            </Text>
                        </Box>
                    </Center>
                    <Hide above="lg">
                        <Spacer />
                    </Hide>
                    <Hide below="250px">
                        <Box>
                            <Button
                                as="a"
                                rel="noopener noreferrer"
                                href={currentShowdownEvent.url}
                                variant={"outline"}
                                _hover={{
                                    opacity: 0.9,
                                    bgColor: "whiteAlpha.500",
                                }}
                                borderWidth={"2xl"}
                                borderColor={"white"}
                                textColor={"white"}
                                h={"30px"}
                            >
                                <Text
                                    fontSize={{
                                        base: "md",
                                        md: "md",
                                        sm: "sm",
                                    }}
                                    casing={"uppercase"}
                                >
                                    Join Now
                                </Text>
                            </Button>
                        </Box>
                    </Hide>
                    <Hide below="md">
                        <Spacer />
                        <HStack mr={5}>
                            <Text
                                fontSize={{
                                    base: "md",
                                    md: "md",
                                    sm: "sm",
                                }}
                                textColor={"white"}
                                fontWeight={"bold"}
                                casing={"uppercase"}
                            >
                                {currentShowdownEvent.points}
                            </Text>
                        </HStack>
                    </Hide>
                </HStack>
            </Container>
        </Box>
    );
};
