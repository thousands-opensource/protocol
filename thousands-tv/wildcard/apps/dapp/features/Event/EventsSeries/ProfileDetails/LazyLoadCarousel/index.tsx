import { Box, Flex, Skeleton, Spinner, Text } from "@chakra-ui/react";
import { TouchEventHandler, useCallback, useState } from "react";
import Flair from "../Flair";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { ISeries, PointItemCategory } from "@repo/interfaces";
import { TouchEvent } from "react";
import { start } from "repl";
interface LazyLoadCarouselProps {
    flairCollections: PointItemCategory;
}

const LazyLoadCarousel = ({ flairCollections }: LazyLoadCarouselProps) => {
    const { name, pointItemCollections: flairs } = flairCollections;
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    //@todo lazy loading on images
    const [isLoading, setIsLoading] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    // Minimum swipe distance for a valid swipe action
    const minSwipeDistance = 50;

    const calculateFlairAssets = useCallback(() => {
        let count = 0;

        flairs.forEach((flair: any) => {
            count = count + flair.pointItems.length;
        });

        return count;
    }, [flairs]);

    const handlePrevious = () => {
        setCurrentIndex((currentIndex - 1 + flairs.length) % flairs.length);
    };

    const handleNext = () => {
        setCurrentIndex((currentIndex + 1) % flairs.length);
    };

    // Handle touch start
    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        setTouchStart(e.targetTouches[0]?.clientX);
    };

    // Handle touch end
    const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        setTouchEnd(e.changedTouches[0]?.clientX);
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        console.log(distance, touchStart, touchEnd);

        if (distance > minSwipeDistance) {
            // Swipe left
            handleNext();
        } else if (distance < -minSwipeDistance) {
            // Swipe right
            handlePrevious();
        }
    };

    const renderSpinner = () => {
        return (
            <Flex
                position="absolute"
                top={0}
                left={0}
                width="100%"
                height="100%"
                align="center"
                borderRadius={"10px"}
                justify="center"
                bg="rgba(0, 0, 0, 0.5)"
                zIndex={1}
            >
                <Spinner size="xl" color="white" />
            </Flex>
        );
    };

    return (
        <Flex
            sx={{
                flexDirection: "column",
                gap: 2,
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <Text sx={{ display: "inline-flex", fontSize: ["x-small"] }}>
                {name}{" "}
                <Text as="span" sx={{ ml: 2 }}>
                    ({calculateFlairAssets()})
                </Text>
            </Text>
            <Flex
                sx={{ gap: 2, alignItems: "center", justifyContent: "center" }}
                align="center"
                justify="center"
            >
                <ChevronLeftIcon
                    sx={{
                        display: ["none", "none", "none", "block"],
                        cursor: "pointer",
                    }}
                    onClick={handlePrevious}
                />
                <Box width={["340px"]} height="100%" position="relative">
                    <Flair flair={flairs[currentIndex]} />
                    {/* {renderSpinner()} */}
                </Box>
                <ChevronRightIcon
                    sx={{
                        display: ["none", "none", "none", "block"],
                        cursor: "pointer",
                    }}
                    onClick={handleNext}
                />
            </Flex>
        </Flex>
    );
};

export default LazyLoadCarousel;
