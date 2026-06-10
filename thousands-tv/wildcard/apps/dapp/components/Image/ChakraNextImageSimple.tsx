import { chakra } from "@chakra-ui/react";
import NextImage from "next/image";

export const ChakraNextImageSimple = chakra(NextImage, {
    shouldForwardProp: (prop) =>
        [
            "width",
            "height",
            "src",
            "alt",
            "onLoadingComplete",
            "placeholder",
            "blurDataURL",
        ].includes(prop),
});
