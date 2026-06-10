import React, { FC } from "react";
import { Flex, Spinner, Text, Portal } from "@chakra-ui/react";

interface LoadingOverlayProps {
    message: string;
    blur?: boolean;
}

/**
 * React component that displays a loading overlay with a spinner and a message.
 */
export const LoadingOverlay: FC<LoadingOverlayProps> = ({
    message,
    blur = true,
}) => (
    <Portal>
        <Flex
            direction="column"
            align="center"
            justify="center"
            position="fixed"
            top={0}
            right={0}
            bottom={0}
            left={0}
            backgroundColor="rgba(0, 0,0, 0.3)"
            backdropFilter={blur ? "blur(10px)" : "none"}
            zIndex={9999}
            borderRadius="md"
            color="white"
        >
            <Spinner size="xl" />
            <Text mt={4} textAlign={"center"}>
                {message}
            </Text>
        </Flex>
    </Portal>
);
