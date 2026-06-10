import { AuthorizedUserData } from "@/utils/backend/sessionServerUtil";
import { redirectUserIfUnauthorized } from "@/utils/sessionUtil";
import { Flex, Text } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { IUser } from "@repo/interfaces";
import { checkUserAuthorizedForPage } from "@/utils/profileUtil";
import SinglePageLayout from "@/layouts/SinglePage";
import CreditsPurchaseUI from "@/hooks/credits/CreditsPurchaseUI";
import DiscountOverview, {
    DISCOUNTS_CONFIG,
} from "@/features/LimitedTime/DiscountOverview";
import CreditBalanceDisplay from "@/components/DashboardNavigation/TopNav/_ui/CreditBalanceDisplay";
import {
    ManageUserWallets,
    WalletDisplayType,
} from "@/components/Wallet/ManageUserWallets";
import { useEffect, useMemo, useState } from "react";
import { poppinsMedium } from "@/utils/themeUtil";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { LimitedTimeDiscount } from "@/types";
import router, { useRouter } from "next/router";
import { limitedOffers } from "@/features/Stream/Body/Credits/contants";
import CreditsLogoutButton from "@/hooks/credits/CreditsLogoutButton";

interface LimitedTimeCreditsPageProps {
    userStr: string;
    error?: string;
}

const LimitedTimePageHost = ({
    userStr,
    error,
}: LimitedTimeCreditsPageProps) => {
    const { setUserDB, userDB } = useWildfileUserContext();
    useEffect(() => {
        if (userStr) {
            const activeUserDBParsed = JSON.parse(userStr);
            setUserDB(activeUserDBParsed);
        }
    }, [userStr, setUserDB]);
    if (error || !userDB) {
        return (
            <SinglePageLayout>
                <Flex
                    sx={{
                        minH: "100vh",
                        width: "100%",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundImage:
                            "url(/images/whitecirclestopbgoverlay01.svg)",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "top center",
                        backgroundBlendMode: "overlay",
                    }}
                >
                    <Text fontSize="4xl" casing="initial">
                        {error}
                    </Text>
                </Flex>
            </SinglePageLayout>
        );
    }
    return (
        <SinglePageLayout>
            <div className="flex items-center justify-end w-full pt-4 px-4 rounded-t-2xl">
                <CreditsLogoutButton />
            </div>
            <LimitedTimeBuyCredits />
        </SinglePageLayout>
    );
};

export const LimitedTimeBuyCredits = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [discountCategory, setDiscountCategory] = useState<
        LimitedTimeDiscount[]
    >([]);

    const router = useRouter();
    const { userDB } = useWildfileUserContext();
    const primaryWalletAddress = userDB?.walletProvider?.address;
    const [areDiscountsLoading, setAreDiscountsLoading] = useState<boolean>(
        !!primaryWalletAddress
    );

    const walletCount = useMemo(
        () => (userDB?.walletProvider?.additionalWallets?.length ?? 0) + 1,
        [userDB]
    );

    useEffect(() => {
        if (primaryWalletAddress) {
            setAreDiscountsLoading(true);
        } else {
            setAreDiscountsLoading(false);
        }
    }, [primaryWalletAddress]);

    // Mapping of button to total bonus
    const bonusMap: Record<number, number> = useMemo(() => {
        const bonuses: Record<string, number> = {};

        limitedOffers.forEach((creditOffer, index) => {
            bonuses[creditOffer.id] = DISCOUNTS_CONFIG.reduce(
                (bonusCount, discountItem) => {
                    const bonus = discountCategory.includes(
                        discountItem.discount
                    )
                        ? discountItem.bonus[index] || 0
                        : 0;
                    return bonusCount + bonus;
                },
                0
            );
        });

        return bonuses;
    }, [discountCategory]);

    const renderWeb3WalletCountDisplay = () => {
        if (!primaryWalletAddress) {
            return <></>;
        }

        return (
            <Flex dir="row" gap={1} className="pb-2">
                <Text
                    fontSize={"9pt"}
                    sx={{
                        color: "#FF5C34",
                    }}
                    className={poppinsMedium.className}
                >
                    Web3 Wallets
                </Text>
                <Text
                    fontSize={"9pt"}
                    sx={{
                        color: "#8e8e8e",
                    }}
                    className={poppinsMedium.className}
                >
                    ({walletCount})
                </Text>
            </Flex>
        );
    };

    const renderDiscountOverview = () => {
        if (!primaryWalletAddress) {
            return <></>;
        }

        return (
            <DiscountOverview
                discountCategory={discountCategory}
                setDiscountCategory={setDiscountCategory}
                walletCount={walletCount}
                onLoadingChange={setAreDiscountsLoading}
            />
        );
    };

    const content = (
        <Flex
            sx={{
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                maxW: ["unset", "unset", "590px"],
                minW: ["200px", "200px", "270px"],
                backgroundImage: "url(/images/whitecirclestopbgoverlay01.svg)",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "top center",
                backgroundBlendMode: "overlay",
            }}
            className={poppinsMedium.className}
        >
            <CreditsPurchaseUI
                bonusMap={bonusMap}
                discountCategory={discountCategory}
                isBonusLoading={areDiscountsLoading}
            />
            <div
                className={`flex gap-2 flex-${
                    isExpanded ? "col" : "row"
                } w-full justify-between`}
            >
                <div style={{ width: isExpanded ? "100%" : "50%" }}>
                    {renderWeb3WalletCountDisplay()}
                    <ManageUserWallets
                        variant={WalletDisplayType.EXPANDER}
                        onExpandChange={setIsExpanded}
                    />
                </div>
                <div>
                    <Flex dir="row" gap={1} className="pb-0">
                        <Text
                            fontSize={"9pt"}
                            sx={{
                                color: "#FF5C34",
                            }}
                            className={poppinsMedium.className}
                        >
                            Current Credits
                        </Text>
                    </Flex>
                    <CreditBalanceDisplay variant="lg" />
                </div>
            </div>

            {renderDiscountOverview()}
        </Flex>
    );

    return content;
};

export default LimitedTimePageHost;

export const getServerSideProps: GetServerSideProps<
    | LimitedTimeCreditsPageProps
    | { redirect: { destination: string; permanent: boolean } }
> = async (context) => {
    try {
        const userAuthorizedForPageResult = await checkUserAuthorizedForPage(
            context
        );

        console.log("not authorized", userAuthorizedForPageResult);

        if (!userAuthorizedForPageResult.success) {
            // redirect the user if they are not authorized
            return userAuthorizedForPageResult.data as {
                redirect: { destination: string; permanent: boolean };
            };
        }

        const authorizedUserData: AuthorizedUserData =
            userAuthorizedForPageResult.data as AuthorizedUserData;

        const userDB: IUser | null = authorizedUserData.userDB;

        const { wildcardAccessToken } = authorizedUserData;

        const redirect = redirectUserIfUnauthorized(
            wildcardAccessToken,
            userDB,
            context
        );

        if (redirect) {
            return redirect;
        }

        return {
            props: {
                userStr: JSON.stringify(userDB),
                error: "",
            },
        };
    } catch (e: any) {
        const error = "Error failed to fetch limited time credits";
        console.error(error);
        return {
            props: {
                userStr: "",
                error,
            },
        };
    }
};
