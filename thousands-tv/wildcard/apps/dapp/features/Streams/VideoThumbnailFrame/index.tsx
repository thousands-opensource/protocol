import React from "react";
import { Box } from "@chakra-ui/react";
import NextLink from "next/link";

interface VideoThumbnailFrameProps {
    thumbnailImage: string;
    iconImage: string;
    hrefToStream: string;
    streamName: string;
}

const VideoThumbnailFrame = ({
    thumbnailImage,
    iconImage,
    hrefToStream,
    streamName,
}: VideoThumbnailFrameProps) => {
    return (
        <Box
            sx={{
                position: "relative",
                flex: "1 1 0",
                height: "100px",
                marginRight: "30px",
                color: "#fff",
            }}
        >
            <NextLink href={hrefToStream} style={{ border: 0 }}>
                <img
                    src={thumbnailImage}
                    width="300px"
                    alt="Wildcard Thumbnail"
                />
            </NextLink>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <img src={iconImage} width="30px" alt="Wildcard" />
                <span>&nbsp; &nbsp;</span>
                <span style={{ fontWeight: "bold", verticalAlign: "middle" }}>
                    {streamName}
                </span>
            </Box>
        </Box>
    );
};

export default VideoThumbnailFrame;
