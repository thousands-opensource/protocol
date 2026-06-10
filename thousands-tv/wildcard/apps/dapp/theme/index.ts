"use client";
import { extendTheme, withDefaultColorScheme } from "@chakra-ui/react";
import * as components from "./components";
import * as foundations from "./foundations";
const theme = extendTheme(
    {
        ...foundations,
        styles: {
            global: {
                body: {
                    bg: "#080B10",
                    scrollBehavior: "smooth",
                },
            },
        },
        components: {
            ...components,
            FormLabel: {
                baseStyle: {
                    fontSize: "sm",
                },
            },
            FormHelperText: {
                baseStyle: {
                    fontSize: "sm",
                },
            },
        },

        config: {
            useSystemColorMode: false,
            initialColorMode: "dark",
        },
    },
    withDefaultColorScheme({ colorScheme: "primary" })
);

export default theme;
