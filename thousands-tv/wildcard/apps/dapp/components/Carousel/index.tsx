import { THEME_COLOR_METALLIC_GREY } from "@/constants/constants";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Box, Flex } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { TouchEvent } from "react";

interface CarouselProps {
    carouselItems: JSX.Element[];
}

const Carousel: React.FC<CarouselProps> = ({ carouselItems }) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [isLeftEnd, setIsLeftEnd] = useState(true);
    const [isRightEnd, setIsRightEnd] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    /**
     * Handle left scroll button click
     */
    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({
                left: -(carouselRef.current.offsetWidth + 8),
                behavior: "smooth",
            });
        }
    };

    /**
     * Handle right scroll button click
     */
    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({
                left: carouselRef.current.offsetWidth + 8,
                behavior: "smooth",
            });
        }
    };

    /**
     * Handle states when scrolling occurs
     */
    const handleScroll = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, offsetWidth } =
                carouselRef.current;

            setIsLeftEnd(scrollLeft === 0);
            setIsRightEnd(
                Math.abs(scrollLeft + offsetWidth - scrollWidth) <= 1
            );
        }
    };

    /**
     * renders items to be shown in carousel
     * @returns JSX
     */
    const renderCarouselItems = () => {
        return carouselItems.map((item, index) => {
            const marginRight =
                index === carouselItems.length - 1 ? "2px" : "8px";
            return (
                <Box key={index} mr={marginRight} minWidth={"100%"}>
                    {item}
                </Box>
            );
        });
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
        if (distance > minSwipeDistance) {
            // Swipe left
            scrollRight();
        } else if (distance < -minSwipeDistance) {
            // Swipe right
            scrollLeft();
        }
    };
    return (
        <Flex
            alignItems="center"
            justifyContent="center"
            id={"carousel"}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <ChevronLeftIcon
                color={isLeftEnd ? "#585858" : THEME_COLOR_METALLIC_GREY}
                cursor={isLeftEnd ? "not-allowed" : "pointer"}
                w="25px"
                h="25px"
                borderRadius={"10px"}
                _hover={{
                    bgColor: isLeftEnd ? "transparent" : "rgb(0,0,0,0.1)",
                }}
                onClick={scrollLeft}
                aria-label={"scroll-left"}
                display={["none", "none", "none", "block"]}
                // visibility={isLeftEnd ? "hidden" : "visible"}
            />
            <Box
                id="carousel-content-container"
                width="100%"
                overflow="hidden"
                whiteSpace="nowrap"
                position="relative"
                ref={carouselRef}
                onScroll={handleScroll}
            >
                <Flex
                    id="carousel-content"
                    width="100%"
                    //height={"60px"}
                    transition="transform 0.3s"
                    alignItems="end"
                >
                    {renderCarouselItems()}
                </Flex>
            </Box>
            <ChevronRightIcon
                color={isRightEnd ? "#585858" : THEME_COLOR_METALLIC_GREY}
                cursor={isRightEnd ? "not-allowed" : "pointer"}
                w="25px"
                h="25px"
                borderRadius={"10px"}
                _hover={{
                    bgColor: isRightEnd ? "transparent" : "rgb(0,0,0,0.1)",
                }}
                onClick={scrollRight}
                aria-label={"scroll-right"}
                display={["none", "none", "none", "block"]}
                /*visibility={
                    isRightEnd || carouselItems.length < 3
                        ? "hidden"
                        : "visible"
                }*/
            />
        </Flex>
    );
};

export default Carousel;
