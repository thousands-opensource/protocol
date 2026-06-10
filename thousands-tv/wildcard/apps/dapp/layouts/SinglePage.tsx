import { THEME_COLOR_SLIGHT_GREY_BACKGROUND } from "@/constants/constants";
import { Container, Flex } from "@chakra-ui/react";
import { ReactNode } from "react";
interface SinglePageLayoutProps {
    children: ReactNode;
}

const SinglePageLayout = ({ children }: SinglePageLayoutProps) => {
    return (
        <Container
            centerContent
            sx={{
                mb: 0,
                mx: 0,
                minH: "inherit",
                bgColor: THEME_COLOR_SLIGHT_GREY_BACKGROUND,
                height: "auto",
                width: "100%",
                margin: "0 auto",
                display: "flex",
                maxW: "full",
                textTransform: "capitalize",
                minWidth: "320px",
                background: "linear-gradient(-45deg, #8c1589, #2c163a, #8c1589)",
                backgroundSize: "100%",
            }}
        >
            {children}
        </Container>
    );
};
export default SinglePageLayout;
