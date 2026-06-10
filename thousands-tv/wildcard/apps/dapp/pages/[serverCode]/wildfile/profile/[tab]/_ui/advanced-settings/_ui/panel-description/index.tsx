import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { ReactNode } from "react";
export interface PanelDescriptionProps {
    title: string;
    description?: ReactNode | string;
    children?: ReactNode;
    flexLeft?: number;
    flexRight?: number;
}

function PanelDescription(props: PanelDescriptionProps) {
    const { title, description, children, flexLeft = 1, flexRight = 2 } = props;

    return (
        <>
            <Flex
                justifyContent="space-between"
                w="full"
                flexDir={{
                    base: "column",
                    lg: "column",
                }}
                gap={{
                    base: 1,
                    lg: 1,
                }}
            >
                <Box flex={flexLeft}>
                    <Stack color="foreground">
                        <Heading fontSize="xl">{title}</Heading>
                        {description && (
                            <Text fontSize={"sm"}>{description}</Text>
                        )}
                    </Stack>
                </Box>
                <Box flex={flexRight}>{children}</Box>
            </Flex>
        </>
    );
}

export default PanelDescription;
