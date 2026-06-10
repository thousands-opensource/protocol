import * as React from "react";
import { Image, ImageProps } from "@chakra-ui/react";

const USDC_LOGO_URL =
  "/images/usdc.png";

export function USDCIcon(props: Omit<ImageProps, "src" | "alt">) {
  return (
    <Image
      src={USDC_LOGO_URL}
      alt="USDC"
      boxSize="20px"
      borderRadius="full"
      display="inline-block"
      {...props}
    />
  );
}