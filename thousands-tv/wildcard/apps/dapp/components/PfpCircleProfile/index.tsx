import { Avatar, AvatarProps, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface Props extends AvatarProps {
    srcUrl: string;
}

// SVG Component for Hexagonal Profile Picture (with PFP Image)
export const PfpCircleProfile = ({ srcUrl, ...rest }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        setIsLoading(true);

        const imgElement = new Image();
        imgElement.src = srcUrl;

        const handleImageLoad = () => {
            setIsLoading(false);
        };

        imgElement.addEventListener("load", handleImageLoad);

        return () => {
            imgElement.removeEventListener("load", handleImageLoad);
        };
    }, [srcUrl]);

    if (isLoading) {
        return (
            <Flex justify={"center"} align={"center"} w={"30vw"}>
                <Spinner color={"#FFFFFF"} />
            </Flex>
        );
    }

    return (
        <Avatar
            src={srcUrl}
            w={"30vw"}
            h={"30vw"}
            borderWidth={{
                base: "8px",
                sm: "10px",
                md: "14px",
                lg: "20px",
            }}
            borderStyle={"solid"}
            bg="transaparent"
            icon={<div />} // use this to prevent default avatar icon from displaying while avatar is rendering
            {...rest}
        />
    );
};
