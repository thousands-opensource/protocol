// useScreenSize.tsx
import { useMediaQuery } from "@chakra-ui/react";

const useScreenSize = () => {
    const [isXxsScreen] = useMediaQuery("(max-width: 440px)");
    const [isXsScreen] = useMediaQuery(
        "(min-width: 441px) and (max-width: 490px)"
    );
    const [isSmScreen] = useMediaQuery(
        "(min-width: 491px) and (max-width: 660px)"
    );
    const [isMdScreen] = useMediaQuery("(min-width: 661px)");

    if (isXxsScreen) {
        return "xxs";
    } else if (isXsScreen) {
        return "xs";
    } else if (isSmScreen) {
        return "sm";
    } else if (isMdScreen) {
        return "md";
    } else {
        // Default value in case none of the media queries match (e.g., during server-side rendering)
        return "unknown";
    }
};

export default useScreenSize;
