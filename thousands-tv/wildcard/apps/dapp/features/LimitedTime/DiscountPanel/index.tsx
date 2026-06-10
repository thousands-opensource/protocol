import { poppinsMedium } from "@/utils/themeUtil";
import { Flex, Button, Divider, Text } from "@chakra-ui/react";
import { DISCOUNTS_CONFIG } from "../DiscountOverview";
import { LimitedTimeDiscount } from "@/types";
import { ChevronRightIcon, StarIcon } from "@chakra-ui/icons";
import Link from "next/link";
import { Fragment } from "react";
import { sum } from "@/utils/util";

interface DiscountPanelProps {
    discountCategory: LimitedTimeDiscount[];
}
const DiscountPanel = ({ discountCategory }: DiscountPanelProps) => {
    return (
        <Flex
            sx={{
                border: "1px solid #92829a",
                borderRadius: "8px",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                minW: "100%",
                padding: "4px",
                p: 3,
                background:
                    "linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)",
            }}
        >
            {DISCOUNTS_CONFIG.map((discountItem, index) => {
                const isDiscountActive = discountCategory.includes(
                    discountItem.discount
                );
                const hasDiscount =
                    !isDiscountActive && Boolean(discountItem.link);
                const bonuses = discountItem.bonus;
                const bonus = Math.round(sum(bonuses) / bonuses.length);
                // const minBonus = Math.min(...bonuses);
                // const maxBonus = Math.max(...bonuses);
                return (
                    <Fragment key={`${discountItem.name}-${index}`}>
                        <Flex
                            sx={{
                                justifyContent: "space-between",
                                alignItems: "center",
                                height: "20px",
                            }}
                        >
                            <Flex
                                sx={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 3,
                                }}
                            >
                                <StarIcon
                                    key={discountItem.name}
                                    color={
                                        isDiscountActive ? "white" : "#372c3e"
                                    }
                                />
                                <Text
                                    fontSize={["11pt", "11pt", "12pt"]}
                                    className={poppinsMedium.className}
                                >
                                    {discountItem.name}
                                </Text>
                                <Text
                                    fontSize={"9pt"}
                                    color="#bbb"
                                    className={poppinsMedium.className}
                                >
                                    +{bonus}% bonus
                                </Text>
                            </Flex>
                            <Flex
                                sx={{
                                    display: hasDiscount ? "flex" : "none",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Link href={discountItem.link} target="_blank">
                                    <Button
                                        sx={{
                                            height: 6,
                                            borderRadius: "16px",
                                            fontSize: "11pt",
                                            bgColor: "#2563EB",
                                            _hover: {
                                                bgColor: "#2563EB",
                                                opacity: ".7",
                                            },
                                            px: { base: 3 },
                                        }}
                                        className={poppinsMedium.className}
                                    >
                                        Get
                                    </Button>
                                </Link>
                                <ChevronRightIcon fontSize={"xl"} />
                            </Flex>
                        </Flex>
                        <Divider
                            sx={{
                                color: "#92829a",
                                display:
                                    DISCOUNTS_CONFIG.length - 1 === index
                                        ? "none"
                                        : "flex",
                            }}
                        />
                    </Fragment>
                );
            })}
        </Flex>
    );
};
export default DiscountPanel;
