import ProfileContext from "@/features/Wildfile/WildfileContext";
import { ColorObject } from "@/types";
import { wildleagueBoldCondensed } from "@/utils/themeUtil";
import { isAssociatedWallet } from "@/utils/userUtil";
import { Box } from "@chakra-ui/react";
import { useContext } from "react";
import { useAccount } from "wagmi";

interface MyBadgesSVGProps {
    avatarThemeColor: ColorObject;
}

const MyBadgesSVG = ({ avatarThemeColor }: MyBadgesSVGProps) => {
    const { address } = useAccount();
    const { pageOwnerUser } = useContext(ProfileContext);

    /**
     * Render string representation 'My Badges' if you are page owner otherwise 'Badges'
     * @returns 'My Badges if page owner otherwise 'Badges'
     */
    const renderMyBadgesText = () => {
        if (!address || isAssociatedWallet(address, pageOwnerUser)) {
            return "Badges";
        }

        return "My Badges";
    };

    return (
        <Box
            as={"svg"}
            id="MyBadgesSVG"
            data-name="MyBadgesSVG"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 154.53 48.88"
            width={"140px"}
            height={"auto"}
        >
            <defs>
                <style>
                    {`
                    .my-badges-vertical-header-line {
                        fill: none;
                        stroke: ${avatarThemeColor.hexValue};
                        stroke-miterlimit: 10;
                        stroke-width: 2px;
                    }

                    .my-badges-header-title {
                        fill: ${avatarThemeColor.hexValue};
                        font-size: 27px;
                        letter-spacing: .02em;
                        text-transform: uppercase;
                        stroke-width: 0px;
                    }
                                
                    .my-badges-trapezoid-background {
                        fill: #161a1e;
                        opacity: .5;
                        stroke-width: 0px;
                    }
                `}
                </style>
            </defs>
            <g id="MyBadgesSVG-2" data-name="MyBadgesSVG-2">
                <g>
                    <polygon
                        className="my-badges-trapezoid-background"
                        points="154.53 0 1 0 1 48.88 142.77 48.88 154.53 0"
                    />
                    <line
                        className="my-badges-vertical-header-line"
                        x1="1"
                        x2="1"
                        y2="48.88"
                    />
                </g>
                <g>
                    <text
                        className={`${wildleagueBoldCondensed.className} my-badges-header-title`}
                        transform="translate(17 33)"
                    >
                        <tspan x="0" y="3">
                            {renderMyBadgesText()}
                        </tspan>
                    </text>
                </g>
            </g>
        </Box>
    );
};

export default MyBadgesSVG;
