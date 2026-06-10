import ProfileContext from "@/features/Wildfile/WildfileContext";
import { ColorObject } from "@/types";
import { wildleagueBoldCondensed } from "@/utils/themeUtil";
import { isAssociatedWallet } from "@/utils/userUtil";
import { Box } from "@chakra-ui/react";
import { useContext } from "react";
import { useAccount } from "wagmi";

interface MyRankingSVGProps {
    avatarThemeColor: ColorObject;
}

const MyRankingSVG = ({ avatarThemeColor }: MyRankingSVGProps) => {
    const { address } = useAccount();
    const { pageOwnerUser } = useContext(ProfileContext);

    /**
     * Render string representation 'My Ranking' if you are the page owner otherwise 'Ranking'
     * @returns 'My Ranking if page owner holder otherwise 'Ranking'
     */
    const renderMyRankingText = () => {
        if (!address || isAssociatedWallet(address, pageOwnerUser)) {
            return "Ranking";
        }

        return "My Ranking";
    };

    return (
        <Box
            as="svg"
            id="MyRankingSVG"
            data-name="MyRankingSVG"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 159.84 48.88"
            width={"140px"}
            height={"auto"}
        >
            <defs>
                <style>
                    {`
                        .my-ranking-vertical-header-line {
                                fill: none;
                                stroke: ${avatarThemeColor.hexValue};
                                stroke-miterlimit: 10;
                                stroke-width: 2px;
                            }

                        .my-ranking-header-title {
                            fill: ${avatarThemeColor.hexValue};
                            font-size: 27px;
                            font-weight: 700;
                            letter-spacing: .02em;
                            text-transform: uppercase;
                            stroke-width: 0px;
                        }
                        
                        .my-ranking-trapezoid-background {
                            fill: #161a1e;
                            opacity: .5;
                            stroke-width: 0px;
                        }
                    `}
                </style>
            </defs>
            <g>
                <g>
                    <g>
                        <polygon
                            className="my-ranking-trapezoid-background"
                            points="159.84 0 1 0 1 48.88 146.74 48.88 159.84 0"
                        />
                        <line
                            className="my-ranking-vertical-header-line"
                            x1="1"
                            x2="1"
                            y2="48.88"
                        />
                    </g>
                    <g>
                        <text
                            className={`${wildleagueBoldCondensed.className} my-ranking-header-title`}
                            transform="translate(17 33)"
                        >
                            <tspan x="0" y="3">
                                {renderMyRankingText()}
                            </tspan>
                        </text>
                    </g>
                </g>
            </g>
        </Box>
    );
};
export default MyRankingSVG;
