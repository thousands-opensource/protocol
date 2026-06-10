import { useMediaQuery } from "@chakra-ui/react";

// Adjust the scale of the avatar hexagon based on the screen size
export const useAvatarHexSizes = () => {
    const [isLargerThanL2500px] = useMediaQuery("(min-width: 2500px)");
    const [isLargerThanLg] = useMediaQuery("(min-width: 803px)");
    const [isLargerThanMd] = useMediaQuery("(min-width: 768px)");
    const [isLargerThanSm] = useMediaQuery("(min-width: 600px)");
    const [isLargerThan350px] = useMediaQuery("(min-width: 350px)");
    const [isLargerThan270px] = useMediaQuery("(min-width: 270px)");
    const [isLargerThan190px] = useMediaQuery("(min-width: 190px)");
    const [isLessThan190px] = useMediaQuery("(max-width: 190px)");

    let scale: number = 1.3;

    switch (true) {
        case isLargerThanL2500px:
            scale = 1.5;
            break;
        case isLargerThanLg:
            scale = 0.9;
            break;
        case isLargerThanMd:
            scale = 0.7;
            break;
        case isLargerThanSm:
            scale = 1.0;
            break;
        case isLargerThan350px:
            scale = 0.9;
            break;
        case isLargerThan270px:
            scale = 0.7;
            break;
        case isLargerThan190px:
            scale = 0.5;
            break;
        case isLessThan190px:
            scale = 0;
            break;
        default:
            scale = 1.3;
    }

    return scale;
};
