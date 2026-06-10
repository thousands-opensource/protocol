import React from "react";
import { ColorModeScript } from "@chakra-ui/react";
import NextDocument, { Html, Head, Main, NextScript } from "next/document";
import { theme } from "../utils/themeUtil";

export default class Document extends NextDocument {
    render() {
        return (
            <Html lang="en">
                <Head />
                <script
                    src={
                        "https://cdn.xsolla.net/payments-bucket-prod/embed/1.5.0/widget.min.js"
                    }
                    async
                ></script>
                <body>
                    <ColorModeScript
                        initialColorMode={theme.config.initialColorMode}
                    />
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
