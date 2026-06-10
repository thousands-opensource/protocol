import {
    Box,
    Button,
    Flex,
    Spacer,
    Text,
    Tooltip,
    useBreakpointValue,
    useToast,
    Link as ChakraLink,
} from "@chakra-ui/react";
import { ChakraNextImageSimple } from "@/components/Image/ChakraNextImageSimple";
import { SocialMediaPlatform } from "@repo/interfaces";
import { NextRouter, useRouter } from "next/router";
import TwitchLogo from "@/public/images/twitch.svg";
import TwitterLogo from "@/public/images/twitter.svg";
import FarcasterLogo from "@/public/images/farcaster.svg";
import { useGlobalContext } from "@/contexts/globalContext";
import * as styles from "@/features/Wildfile/WildFileProfile/styles";
import {
    TWITCH_BASE_URL,
    TWITTER_BASE_URL,
    WARPCAST_BASE_URL,
    toastDefaultOptions,
} from "@/constants/constants";
import { handleSignInDeprecated } from "@/utils/oauthUtil";
import { useAccount } from "wagmi";
import ViewWildeventButton from "../../ViewWildeventButton";
import { checkPageOwnerUser } from "@/utils/userUtil";
import ProfileContext from "@/features/Wildfile/WildfileContext";
import { useCallback, useContext, useEffect, useState } from "react";
import { getElementIdLinkSocials } from "@/utils/gtagUtil";
import { getUserIdProfileRoute } from "@/utils/routeUtil";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import Link from "next/link";
import {
    SignInButton,
    StatusAPIResponse,
    useSignIn,
} from "@farcaster/auth-kit";
import { get1HourExpirationIsoDate } from "@/utils/util";
import axios from "axios";
import QRCodeDialog from "@/components/QRCodeDialog";
import {
    IUser,
    LinkedAccountProvider,
    WildcardApiResponse,
} from "@repo/interfaces";

export interface RenderSocialIconProps {
    user: IUser;
    social: SocialMediaPlatform;
}

// render social component (icon only)
export const RenderSocialIcon = ({ user, social }: RenderSocialIconProps) => {
    const router = useRouter();
    const { isLinked, logoSrc } = getLinkedSocialData(user, social, router);
    if (!isLinked) return <></>;

    return (
        <Flex sx={styles.linkUnlinkFlexSx} alignItems="center">
            <Box ml={2}>
                <ChakraNextImageSimple
                    src={logoSrc}
                    alt={`${social} logo`}
                    height={35}
                    width={35}
                    sx={styles.socialImgSx(isLinked)}
                />
            </Box>

            <Box>
                <Text fontSize="xs">Linked</Text>
            </Box>
        </Flex>
    );
};

/**
 * Gets linked social data of a user
 * @param user - user object
 * @param social - social platform (twitch or twitter)
 * @param router - next router
 * @returns - linked social data od user
 */
export const getLinkedSocialData = (
    user: IUser,
    social: SocialMediaPlatform,
    router: NextRouter
) => {
    const socialData = {
        isLinked: false,
        logoSrc: "",
        linkedTo: "",
        linkFunction: () => {},
    };

    if (social == "twitch") {
        socialData.logoSrc = TwitchLogo.src;
        socialData.linkFunction = () =>
            handleSignInDeprecated(user, LinkedAccountProvider.TWITCH);

        const twitchAccount = user?.twitchProvider;
        if (!twitchAccount) {
            return socialData;
        }

        socialData.isLinked = !!twitchAccount.id;
        socialData.linkedTo = twitchAccount.name || "";
    } else if (social == "twitter") {
        socialData.isLinked = !!(
            user?.twitterProvider && user?.twitterProvider.id
        );
        socialData.logoSrc = TwitterLogo.src;
        socialData.linkedTo = user?.twitterProvider?.name || "";
        // socialData.txnHash = user?.twitterProvider?.wildevent?.txnHash || "";
        // socialData.linkFunction = () =>
        //     handleLinkTwitterOAuth2Url(router, wildfileId);
        socialData.linkFunction = () => {};
    } else if (social === "farcaster") {
        socialData.isLinked = !!(
            user?.farcasterProvider && user?.farcasterProvider.id
        );
        socialData.logoSrc = FarcasterLogo.src;
        // socialData.linkedTo = user?.farcasterProvider.name || "";
        // socialData.txnHash =
        //     user?.farcasterProvider?.wildevent?.txnHash || "";
        socialData.linkFunction = () => {};
    }

    return socialData;
};

export interface SocialsProps {
    user: IUser;
    social: SocialMediaPlatform;
}

/**
 * renders link socials component card to link socials
 * @param social - twitch or twitter
 * @returns JSX
 */
const LinkSocialsCard = ({ user, social }: SocialsProps) => {
    const { address } = useAccount();
    const router = useRouter();
    const { loggedIn } = useGlobalContext();
    const toast = useToast();
    const isMobile = useBreakpointValue({ base: true, sm: false });
    const { pageOwnerUser, setPageOwnerUser, setUserActivity, userActivity } =
        useContext(ProfileContext);
    const [showDialog, setShowDialog] = useState(false);

    const isOwner = checkPageOwnerUser(loggedIn, address, pageOwnerUser);

    const showPrivateInfo = isOwner || user?.preferences?.showLinkedSocials;

    const { isLinked, logoSrc, linkedTo, linkFunction } = getLinkedSocialData(
        user,
        social,
        router
    );

    const handleClick = () => {
        if (!loggedIn) {
            toast({
                ...toastDefaultOptions,
                description: "Login first to link your social!",
                status: "warning",
                duration: 10000,
            });
            return;
        }
        linkFunction();
    };

    // renders UI friendly name e.g. "twitter" to "X (Twitter)"
    const renderSocialName = (social: SocialMediaPlatform) => {
        switch (social) {
            case "twitch":
                return "Twitch";
            case "twitter":
                return "X (Twitter)";
            case "farcaster":
                return "Farcaster";
        }
    };

    /**
     * Get user social media link
     * @param social - represents enum var either twitter or twitch
     * @returns social media link to user profile
     */
    const getSocialMediaLink = (social: SocialMediaPlatform) => {
        switch (social) {
            case "twitch":
                return `${TWITCH_BASE_URL}/${linkedTo}`;
            case "twitter":
                return `${TWITTER_BASE_URL}/${linkedTo}`;
            case "farcaster":
                return `${WARPCAST_BASE_URL}/${linkedTo}`;
            default:
                return getUserIdProfileRoute(
                    pageOwnerUser?._id?.toString() || ""
                );
        }
    };

    /**
     * Call our API and show a success or error on front end
     * @param StatusAPIResp - get us needed params from farcaster like fid, message, signature, nonce
     */
    const handleLinkFarcaster = async ({
        fid,
        username,
        message,
        signature,
        nonce,
    }: StatusAPIResponse) => {
        const body = {
            fid,
            username,
            message,
            signature,
            nonce,
        };
        const response = await axios.post("/api/connectFarcaster", body);

        const war: WildcardApiResponse = response.data;
        setShowDialog(false);
        if (!war.success) {
            const errMsg = war.err;
            toast({
                ...toastDefaultOptions,
                description: `There has been an error linking your Wildfile and Farcaster with id: ${fid}`,
                status: "error",
                duration: 5000,
            });
            console.log(errMsg);
            return;
        }

        // NOTE: deprecated, use ActivityLog instead
        const { updatedUser, newActivityItem } = war.data;
        setPageOwnerUser(updatedUser);
        toast({
            ...toastDefaultOptions,
            description: `You have successfully linked your Wildfile and Farcaster with id: ${fid}`,
            status: "success",
            duration: 5000,
        });

        if (newActivityItem) {
            setUserActivity([newActivityItem, ...userActivity]);
        }
    };

    const onSuccessCallback = useCallback((res: StatusAPIResponse) => {
        handleLinkFarcaster?.(res);
    }, []);

    //Error callback function to show user toast message
    const onErrorCallback = useCallback(() => {
        setShowDialog(false);
        toast({
            ...toastDefaultOptions,
            description: `There has been an error linking your Wildfile with your Farcaster, try again.`,
            status: "error",
            duration: 5000,
        });
    }, []);

    const signInState = useSignIn({
        onSuccess: onSuccessCallback,
        onError: onErrorCallback,
        expirationTime: get1HourExpirationIsoDate(),
    });
    const { signIn, connect, reconnect, isError, channelToken, url } =
        signInState;

    //Handle user clicking link to show qr code
    const onLoginClick = useCallback(() => {
        if (isError) {
            reconnect();
        }
        setShowDialog(true);
        signIn();
    }, [isError, reconnect, signIn, url]);

    //Need this use effect to get the channel token for the sign in hook for farcaster
    useEffect(() => {
        if (!channelToken) {
            connect();
        }
    }, [channelToken, connect]);

    const renderCustomLinkButton = () => {
        if (social === "twitch" || social === "twitter") {
            return (
                <Button
                    id={getElementIdLinkSocials(social)}
                    border={"1px"}
                    variant="ghost"
                    onClick={handleClick}
                    isDisabled={isMobile}
                    textTransform={"uppercase"}
                    sx={styles.buttonSx("blackAlpha.900")}
                >
                    Link
                </Button>
            );
        } else if (social === "farcaster") {
            return (
                <>
                    <Button
                        id={getElementIdLinkSocials(social)}
                        border={"1px"}
                        variant="ghost"
                        isDisabled={isMobile}
                        onClick={onLoginClick}
                        textTransform={"uppercase"}
                        sx={styles.buttonSx("blackAlpha.900")}
                    >
                        Link
                    </Button>
                    {url && (
                        <QRCodeDialog
                            open={showDialog}
                            onClose={() => setShowDialog(false)}
                            url={url}
                        />
                    )}
                </>
            );
        }

        return <></>;
    };

    /**
     * Renders linked/unlinked status of socials (Linked to Twitter)
     */
    const renderLinkedUnlinkedJsx = () => {
        if (isLinked) {
            if (showPrivateInfo) {
                return (
                    <Flex sx={styles.linkedBoxFlexSx}>
                        <Box>
                            <Text sx={styles.linkedBoxTextSx}>
                                Linked to{" "}
                                <ChakraLink
                                    as={Link}
                                    href={getSocialMediaLink(social)}
                                    target="_blank"
                                    passHref={true}
                                    sx={styles.socialMediaLinkStyle}
                                >
                                    {linkedTo}
                                    <ExternalLinkIcon mx="4px" />
                                </ChakraLink>
                            </Text>
                        </Box>
                        <Spacer />
                        {/* <Box>
                            <ViewWildeventButton txnHash={txnHash} />
                        </Box> */}
                    </Flex>
                );
            }
        }
        if (isOwner) {
            return (
                <Flex sx={styles.linkedBoxFlexSx}>
                    <Box>
                        <Text>Link to {renderSocialName(social)}</Text>
                    </Box>
                    <Spacer />
                    <Box>
                        <Tooltip
                            label={
                                isMobile
                                    ? "LINKING SOCIALS CAN ONLY BE DONE ON DESKTOP"
                                    : ""
                            }
                            sx={styles.toolTip}
                        >
                            {renderCustomLinkButton()}
                        </Tooltip>
                    </Box>
                </Flex>
            );
        }

        return <>{`${renderSocialName(social)} Not Linked Yet`}</>;
    };

    return (
        <Flex gap={3} mt={2}>
            <Flex>
                <ChakraNextImageSimple
                    src={logoSrc}
                    alt={`${social} logo`}
                    height={35}
                    width={35}
                    sx={styles.socialImgSx(isLinked)}
                />
            </Flex>
            <Flex flex={2}>{renderLinkedUnlinkedJsx()}</Flex>
        </Flex>
    );
};

export default LinkSocialsCard;
