"use client";
import {
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
} from "@chakra-ui/react";
import Sidenav from "./Sidenav/Sidenav";
import { blurredBackground } from "@/theme/components/shared";
import { FC } from "react";

interface ISideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * React component that displays a side drawer.
 */
const SideDrawer: FC<ISideDrawerProps> = ({ isOpen, onClose }) => {
    return (
        <>
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
                <DrawerOverlay />
                <DrawerContent sx={blurredBackground}>
                    <DrawerHeader>
                        <DrawerCloseButton color="white" />
                    </DrawerHeader>

                    <DrawerBody p="0">
                        <Sidenav />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </>
    );
};

export default SideDrawer;
