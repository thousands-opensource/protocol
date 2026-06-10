import { useContext } from "react";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { gilroySemiBold, wildleagueBoldCondensed } from "@/utils/themeUtil";
import { checkPageOwnerUser } from "@/utils/userUtil";
import { shorten } from "@/utils/util";
import { Box } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import { useGlobalContext } from "@/contexts/globalContext";
import { ColorObject } from "@/types";

interface ShowcaseHeaderSVGProps {
    avatarThemeColor: ColorObject;
}

const ShowcaseHeaderSVG = ({ avatarThemeColor }: ShowcaseHeaderSVGProps) => {
    const { address } = useAccount();
    const { loggedIn } = useGlobalContext();
    const { pageOwnerUser, swagSets, badges } = useContext(ProfileContext);

    const isOwner = checkPageOwnerUser(loggedIn, address, pageOwnerUser);
    const showPrivateInfo =
        isOwner || pageOwnerUser.preferences.showLinkedSocials;

    /**
     * Get string representation of total owned swag sets over total swag sets
     * @returns string representation total owned swag sets over total swag sets
     */
    const getTotalSwagOwnedStringJsx = () => {
        const numActiveCompeletedSwagSets = badges.reduce((count, badge) => {
            const isActiveCompletedSwagSet = badge.userIds.includes(
                pageOwnerUser._id?.toString() || ""
            );
            return badge.type === "swagSet" && isActiveCompletedSwagSet
                ? ++count
                : count;
        }, 0);
        return `${numActiveCompeletedSwagSets.toString()}/${swagSets.length.toString()}`;
    };

    /**
     * Get showcase owner
     * @returns showcase owner
     */
    const getShowcaseOwner = () => {
        if (showPrivateInfo && pageOwnerUser?.discordProvider?.discordTag) {
            return `${shorten(pageOwnerUser?.discordProvider?.discordTag)}\'\s`;
        }

        if (pageOwnerUser.walletProvider?.address) {
            return `${shorten(pageOwnerUser.walletProvider?.address, {
                isAddress: true,
            })}\'\s`;
        }

        return "";
    };

    const showcaseOwner = getShowcaseOwner();
    return (
        <Box
            as="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400.38 48.88"
            width={["100%", "100%", "100%", "400px"]}
            height={"49px"}
        >
            <defs>
                <style>
                    {`.vertical-header-line {
                        fill: none;
                        stroke: ${avatarThemeColor.hexValue};
                        stroke-miterlimit: 10;
                        stroke-width: 2px;
                    }

                    .header-title {
                        fill: ${avatarThemeColor.hexValue};
                        font-size: 27px;
                        font-weight: 700;
                        letter-spacing: .02em;
                        text-transform: uppercase;

                    }

                    .reverse-right-trapezoid {
                        fill: #383c40;
                        stroke-width: 0px;
                    }

                    .swag-pin-count {
                        fill: #ffffff;
                        font-size: 16px;
                        stroke-width: 0px;
                    }`}
                </style>
            </defs>
            <g id="Layer_8" data-name="Layer 8">
                <g>
                    <polygon
                        className="reverse-right-trapezoid"
                        points="400.38 0 .5 0 .5 48.88 387.28 48.88 400.38 0"
                    />
                    <text
                        className={`${wildleagueBoldCondensed.className} header-title`}
                        transform="translate(10.73 33)"
                    >
                        <tspan x="0" y="3">
                            {`${showcaseOwner} showcase`}
                        </tspan>
                        <tspan
                            x="330.28"
                            y="-5"
                            className={`${gilroySemiBold.className} swag-pin-count`}
                        >
                            {`(${getTotalSwagOwnedStringJsx()})`}
                        </tspan>
                    </text>
                    <line
                        className="vertical-header-line"
                        x1="1.5"
                        x2="1.5"
                        y2="48.88"
                    />
                </g>
            </g>
        </Box>
    );
};

export default ShowcaseHeaderSVG;
