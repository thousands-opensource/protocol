"use client";
import { ConicalOvalBg } from "@/components/Background/ConicalOvalBg";
import { Box, Container, Flex, useDisclosure } from "@chakra-ui/react";
import React, { FC, useEffect } from "react";
import { HiArrowLeft } from "react-icons/hi";

interface IBackgroundLayoutProps {
    children: React.ReactNode;
}

const BackgroundLayout: FC<IBackgroundLayoutProps> = ({ children }) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const sidenavState = useDisclosure({ defaultIsOpen: true });

    useEffect(() => {
        sidenavState.isOpen = true;
    }, [sidenavState]);

    return (
        <>
            <Flex as="section">
                <Box
                    h="100dvh"
                    w="full"
                    overflowX="hidden"
                    overflowY="auto"
                    backgroundImage="url('/images/background-ui.png')"
                    backgroundPosition="center"
                    backgroundRepeat="no-repeat"
                    backgroundSize="cover"
                >
                    <Container maxWidth="container.xl" mx="auto">
                        <Box>
                            <ConicalOvalBg />
                        </Box>
                        {/* <ConicalOvalBg bottom="0" right="0" left="" /> */}
                        <Box mb="30px" />

                        <Box mx="15px">{children}</Box>
                        <Box h="20" />
                    </Container>
                </Box>
            </Flex>
        </>
    );
};

export default BackgroundLayout;
