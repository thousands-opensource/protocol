import { poppinsMedium } from "@/utils/themeUtil";
import { Flex, Text } from "@chakra-ui/react";
import { DISCOUNTS_CONFIG } from "../DiscountOverview";
import { useMemo } from "react";
import { LimitedTimeDiscount } from "@/types";
import { StarIcon } from "@chakra-ui/icons";
import { sum } from "@/utils/util";

interface YourStatusProps {
    discountCategory: LimitedTimeDiscount[];
}
const YourStatus = ({ discountCategory }: YourStatusProps) => {
    // const minBonus = useMemo(() => {
    //     return DISCOUNTS_CONFIG.reduce((bonusCount, discountItem) => {
    //         const bonus = discountCategory.includes(discountItem.discount)
    //             ? Math.min(...discountItem.bonus)
    //             : 0;
    //         return bonusCount + bonus;
    //     }, 0);
    // }, [discountCategory]);

    // const maxBonus = useMemo(() => {
    //     return DISCOUNTS_CONFIG.reduce((bonusCount, discountItem) => {
    //         const bonus = discountCategory.includes(discountItem.discount)
    //             ? Math.max(...discountItem.bonus)
    //             : 0;
    //         return bonusCount + bonus;
    //     }, 0);
    // }, [discountCategory]);

    const totalBonus = useMemo(() => {
        return DISCOUNTS_CONFIG.reduce((bonusCount, discountItem) => {
            const bonus = discountCategory.includes(discountItem.discount)
                ? Math.round(
                      sum(discountItem.bonus) / discountItem.bonus.length
                  )
                : 0;
            return bonusCount + bonus;
        }, 0);
    }, [discountCategory]);
    const totalStars = DISCOUNTS_CONFIG.length;
    const starCount = useMemo(() => {
        return DISCOUNTS_CONFIG.reduce((star, discountItem) => {
            return discountCategory.includes(discountItem.discount)
                ? star + 1
                : star;
        }, 0);
    }, [discountCategory]);

    return (
        <Flex
            sx={{
                justifyContent: "space-between",
                alignItems: "center",
                minW: "100%",
            }}
        >
            <Flex
                sx={{
                    gap: 3,
                }}
            >
                <Text
                    fontSize={"9pt"}
                    sx={{
                        color: "#FF5C34",
                    }}
                    className={poppinsMedium.className}
                >
                    Your Status
                </Text>
                <Text
                    fontSize={"9pt"}
                    sx={{
                        color: "#8E8E8E",
                    }}
                    className={poppinsMedium.className}
                >
                    ({totalBonus}%)
                </Text>
            </Flex>
            <Flex
                sx={{
                    gap: 1,
                }}
            >
                {Array.from({ length: totalStars }).map((_, index) => {
                    const isActive = index < starCount;
                    return (
                        <StarIcon
                            key={index}
                            color={isActive ? "white" : "#5d4765"}
                        />
                    );
                })}
            </Flex>
        </Flex>
    );
};
export default YourStatus;
