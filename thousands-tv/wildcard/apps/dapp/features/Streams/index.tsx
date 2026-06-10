import { alabasterColorObj } from "@/utils/wildpassUtil";
import { parentContainerSx } from "../Wildfile/WildFileProfile/styles";
import VideoThumbnailFrame from "./VideoThumbnailFrame";
import { Box, Container, Flex } from "@chakra-ui/react";

const Streams = () => {
    return (
        // <Container centerContent sx={parentContainerSx}>
        <Flex
            sx={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                backgroundColor: "blackAlpha.900",
            }}
            direction="column"
        >
            <Box
                sx={{
                    flex: "1 1 0",
                    height: "100%",
                    color: "#fff",
                    mx: "0",
                    // "@md": { flex: "2 1 0" },
                }}
            >
                <Flex
                    sx={{
                        width: "100%",
                        height: "100%",
                        overflow: "wrap",
                        margin: "50px",
                    }}
                    direction="row"
                >
                    <VideoThumbnailFrame
                        thumbnailImage="/images/wildcardthumb01.png"
                        iconImage="/images/wildcardicon01.png"
                        hrefToStream="/stream/664fde414304722b3a5e177e"
                        streamName="Wildcard [Stage 1]"
                    />
                    <VideoThumbnailFrame
                        thumbnailImage="/images/wildcardthumb03.png"
                        iconImage="/images/wildcardicon01.png"
                        hrefToStream="/stream/664fde414304722b3a5e177e"
                        streamName="Wildcard [Stage 2]"
                    />
                    <VideoThumbnailFrame
                        thumbnailImage="/images/wildcardthumb03.png"
                        iconImage="/images/wildcardicon01.png"
                        hrefToStream="/stream/664fde414304722b3a5e177e"
                        streamName="Wildcard [Stage 3]"
                    />
                    <VideoThumbnailFrame
                        thumbnailImage="/images/wildcardthumb03.png"
                        iconImage="/images/wildcardicon01.png"
                        hrefToStream="/stream/664fde414304722b3a5e177e"
                        streamName="Wildcard [Stage 4]"
                    />
                </Flex>
            </Box>
        </Flex>
        // </Container>
    );
};
export default Streams;
