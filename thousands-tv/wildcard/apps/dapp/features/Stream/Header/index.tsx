import { useState, Dispatch, SetStateAction, useEffect } from "react";
import { THEME_COLOR_DARK_ONYX } from "@/constants/constants";
import WildfileNavigation from "@/features/Wildfile/WildFileProfile/WildfileNavigation";
import {
    IdleEvent,
    ConsumableCommandAction,
    THOUSANDS_SERIES_NAME,
} from "@/types";
import { Text } from "@chakra-ui/react";
import { poppinsBold } from "@/utils/themeUtil";

const Header = () => {
    return (
        <WildfileNavigation
            thousandsSeriesName={THOUSANDS_SERIES_NAME.ALPHA_SERIES}
            personalCredit={0}
            isSquareCorner={true}
        />
    );
};
export default Header;
