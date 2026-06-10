import { ColorObject } from "@/types";
import { Box } from "@chakra-ui/react";

interface CurrentLeaderboardsSVGProps {
    avatarThemeColor: ColorObject;
}

const CurrentLeaderboardsSVG = ({
    avatarThemeColor,
}: CurrentLeaderboardsSVGProps) => {
    return (
        <Box
            as="svg"
            id="CurrentLeaderboardsSVG"
            data-name="CurrentLeaderboardsSVG"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 282.86 49.81"
            width={"250px"}
            height={"auto"}
        >
            <defs>
                <style>
                    {`
                        .current-leaderboard-vertical-header-line {
                            fill: none;
                            stroke: ${avatarThemeColor.hexValue};
                            stroke-miterlimit: 10;
                            stroke-width: 2px;
                        }

                        .current-leaderboard-header-title {
                            fill: ${avatarThemeColor.hexValue};
                            font-size: 27px;
                            font-weight: 700;
                            letter-spacing: .02em;
                            text-transform: uppercase;
                            stroke-width: 0px;
                        }
                        
                        .current-leaderboard-trapezoid-background {
                            fill: #161a1e;
                            opacity: .5;
                            stroke-width: 0px;
                        }
                    `}
                </style>
            </defs>
            <g>
                <g>
                    <polygon
                        className="current-leaderboard-trapezoid-background"
                        points="282.86 0 1 .92 1 49.81 269.76 48.88 282.86 0"
                    />
                    <g>
                        <path
                            className="current-leaderboard-header-title"
                            d="m24.7,22.16v-5.1h-2.11v16.55h2.11v-5.1h4.02v5.96c0,2-1.03,3.46-2.81,3.46h-4.59c-1.78,0-2.81-1.46-2.81-3.46v-18.3c0-1.97,1.03-3.43,2.81-3.43h4.59c1.78,0,2.81,1.46,2.81,3.43v5.99h-4.02Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m35.99,32.96h1.89V12.74h4.32v21.73c0,2.27-1.32,3.46-2.86,3.46h-4.83c-1.57,0-2.83-1.13-2.83-3.46V12.74h4.32v20.22Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m55.3,23.35l-2.11,2.83,2.4,11.74h-4.75l-1.81-10.66v10.66h-4.59V12.74h7.61c1.78,0,3.24,1.46,3.24,3.24v7.37Zm-4.59-1.38v-4.86c0-.08-.03-.11-.08-.11h-1.62v6.26h.51l1.19-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m68.31,23.35l-2.11,2.83,2.4,11.74h-4.75l-1.81-10.66v10.66h-4.59V12.74h7.61c1.78,0,3.24,1.46,3.24,3.24v7.37Zm-4.59-1.38v-4.86c0-.08-.03-.11-.08-.11h-1.62v6.26h.51l1.19-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m70.85,12.74h8.53v4.24h-3.99v5.99h2.78v3.97h-2.78v6.72h3.99v4.26h-8.53V12.74Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m82.03,12.74h3.91l2.27,9.91v-9.91h4.16v25.18h-3.37l-2.78-11.74v11.74h-4.18V12.74Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m97.25,16.9h-2.81v-4.16h9.99v4.16h-3v21.03h-4.18v-21.03Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m111.38,12.74h4.51v20.6h3.08v4.59h-7.58V12.74Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m121.26,12.74h8.53v4.24h-3.99v5.99h2.78v3.97h-2.78v6.72h3.99v4.26h-8.53V12.74Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m135.16,12.74h4.94l3.59,25.18h-4.32l-.35-2.81v-.19h-2.78v.19l-.35,2.81h-4.32l3.59-25.18Zm2.24,8.21l-.67,10.07h1.81l-.62-10.07h-.51Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m145.83,37.93V12.74h7.42c1.75,0,2.83,1.54,2.83,3.48v18.22c0,1.94-1.08,3.48-2.83,3.48h-7.42Zm4.1-20.95v16.68h1.3c.32,0,.54-.38.62-.62.08-.41.11-1.05.11-1.27v-12.88c0-.22-.03-1.27-.11-1.62-.08-.3-.3-.3-.62-.3h-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m158.87,12.74h8.53v4.24h-3.99v5.99h2.78v3.97h-2.78v6.72h3.99v4.26h-8.53V12.74Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m180.44,23.35l-2.11,2.83,2.4,11.74h-4.75l-1.81-10.66v10.66h-4.59V12.74h7.61c1.78,0,3.24,1.46,3.24,3.24v7.37Zm-4.59-1.38v-4.86c0-.08-.03-.11-.08-.11h-1.62v6.26h.51l1.19-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m193.45,21.92c0,2.73-2.7,3.08-2.7,3.08,0,0,2.7.46,2.7,3.08v6.37c0,1.94-1.05,3.48-2.81,3.48h-7.48V12.74h7.48c1.75,0,2.81,1.51,2.81,3.48v5.7Zm-6.16-4.94v6.1h1.49c.27,0,.49-.22.49-.46v-5.16c0-.27-.22-.49-.49-.49h-1.49Zm0,16.65h1.49c.27,0,.49-.22.49-.46v-5.75c0-.27-.22-.46-.49-.46h-1.49v6.67Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m196.18,16.17c0-2.29,1.43-3.43,3-3.43h4.83c1.57,0,3,1.13,3,3.43v18.3c0,2.32-1.43,3.46-3,3.46h-4.83c-1.57,0-3-1.13-3-3.46v-18.3Zm4.32.89v16.55h2.21v-16.55h-2.21Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m212.27,12.74h4.94l3.59,25.18h-4.32l-.35-2.81v-.19h-2.78v.19l-.35,2.81h-4.32l3.59-25.18Zm2.24,8.21l-.67,10.07h1.81l-.62-10.07h-.51Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m233.14,23.35l-2.11,2.83,2.4,11.74h-4.75l-1.81-10.66v10.66h-4.59V12.74h7.61c1.78,0,3.24,1.46,3.24,3.24v7.37Zm-4.59-1.38v-4.86c0-.08-.03-.11-.08-.11h-1.62v6.26h.51l1.19-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m235.95,37.93V12.74h7.42c1.75,0,2.83,1.54,2.83,3.48v18.22c0,1.94-1.08,3.48-2.83,3.48h-7.42Zm4.1-20.95v16.68h1.3c.32,0,.54-.38.62-.62.08-.41.11-1.05.11-1.27v-12.88c0-.22-.03-1.27-.11-1.62-.08-.3-.3-.3-.62-.3h-1.3Z"
                        />
                        <path
                            className="current-leaderboard-header-title"
                            d="m252.64,33.61h1.57v-3.29c-1.54-2.51-3.1-5.02-4.64-7.53-.62-1.05-1.05-2.29-1.05-3.62v-3c0-2.27,1.3-3.43,2.86-3.43h4.16c1.54,0,2.83,1.16,2.83,3.43v3.7h-4.1v-2.81h-1.57v2.78c1.54,2.48,3.08,5.02,4.62,7.5.65,1.08,1.05,2.35,1.05,3.64v3.48c0,2.27-1.3,3.46-2.83,3.46h-4.16c-1.57,0-2.86-1.19-2.86-3.46v-4.62h4.13v3.75Z"
                        />
                    </g>
                    <line
                        className="current-leaderboard-vertical-header-line"
                        x1="1"
                        y1=".92"
                        x2="1"
                        y2="49.81"
                    />
                </g>
            </g>
        </Box>
    );
};

export default CurrentLeaderboardsSVG;
