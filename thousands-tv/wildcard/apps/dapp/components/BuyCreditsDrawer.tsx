import React from "react";
import {
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    useBreakpointValue,
} from "@chakra-ui/react";
import { useBuyCreditsStore } from "@/store/useBuyCreditsStore";
import { LimitedTimeBuyCredits } from "@/pages/[serverCode]/limitedtimecredits";
import { usePathname } from "next/navigation";

export const BuyCreditsDrawer = ({
    blurBackground = true
} : {
    blurBackground?: boolean
}) => {
    const { isBuyCreditsPopupOpen, setBuyCreditsPopupOpen } = useBuyCreditsStore();
    const drawerWidth = useBreakpointValue({ base: "100%", md: "40%" });
    const pathname = usePathname();

    if (pathname.includes("/stream")) blurBackground = false;

    return (
        <Drawer
            blockScrollOnMount={false}
            isOpen={isBuyCreditsPopupOpen}
            placement="right"
            onClose={() => setBuyCreditsPopupOpen(false)}
        >
            {blurBackground && <DrawerOverlay />}
            <DrawerContent maxW={drawerWidth}>
                <DrawerCloseButton />
                <DrawerHeader>Buy Credits</DrawerHeader>
                <DrawerBody>
                    <LimitedTimeBuyCredits />
                </DrawerBody>
            </DrawerContent>
        </Drawer>
    );
};