import { emptyPfp, FETCH_PFPS_ENDPOINT } from "@/constants/constants";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import AvatarCollection from "@/features/Wildfile/WildFileProfile/Main/AvatarCollection";
import { ColorObject } from "@/types";
import { getUserPfp, getUserProfilePicture } from "@/utils/userUtil";
import {
    alabasterColorObj,
    getAllowedThemeColorObjectByColorName,
} from "@/utils/wildpassUtil";
import { Avatar, Box, Flex } from "@chakra-ui/react";
import { PfpMetadata, WildcardApiResponse } from "@repo/interfaces";
import { Network, OwnedNft } from "alchemy-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

interface ProfilePicProps {
    showEditIcon: boolean;
}


const ProfilePic: React.FC<ProfilePicProps> = ({ showEditIcon }) => {
    const { connectedUserDBEmail, userDB } = useWildfileUserContext();
    const currentPfp = userDB ? getUserPfp(userDB) : emptyPfp;
    const userDBAvatarThemeColor = userDB?.preferences?.avatarThemeColor;
    const themeColorObj = getAllowedThemeColorObjectByColorName(
        userDBAvatarThemeColor || alabasterColorObj
    );

    const [avatarThemeColor, setAvatarThemeColor] =
        useState<ColorObject>(themeColorObj);
    const [isPfpsLoading, setIsPfpsLoading] = useState<boolean>(false);
    const [accountProviderPfps, setAccountProviderPfps] = useState<
        PfpMetadata[]
    >([]);
    const [nftPfps, setNftPfps] = useState<OwnedNft[]>([]);
    const [totalPfpCount, setTotalPfpCount] = useState<number>(0);
    const [nextPageKeys, setNextPageKeys] = useState<Record<string, string>>(
        {}
    );
    const [pfpSelected, setPfpSelected] = useState<PfpMetadata>(currentPfp);
    const [profPictureSrc, setProfPictureSrc] = useState<string>(
        getUserProfilePicture(userDB)
    );
    const { address } = useAccount();

    /**
     * Fetch PFPs for the user from account providers and networks.
     */
    const handleFetchPfps = async () => {
        setIsPfpsLoading(true);
        if (!address || !userDB) {
            setAccountProviderPfps([]);
            setNftPfps([]);
            setTotalPfpCount(0);
            setNextPageKeys({});
            setIsPfpsLoading(false);
            return;
        }

        const networks = [Network.ETH_MAINNET, Network.MATIC_MAINNET];

        try {
            const response = await axios.post(FETCH_PFPS_ENDPOINT, {
                nextPageKeys,
                networks,
            });

            const { data, success } = response.data as WildcardApiResponse;
            if (!success) {
                setAccountProviderPfps([]);
                setNftPfps([]);
                setTotalPfpCount(0);
                setNextPageKeys({});
                setIsPfpsLoading(false);
                return;
            }

            const {
                accountProviderPfps: apPfps,
                nftPfps: nPfps,
                pageKeys,
                totalCount,
            } = data;

            setAccountProviderPfps(apPfps);
            setNftPfps(nPfps);
            setTotalPfpCount(totalCount);
            setNextPageKeys(pageKeys);
        } catch (error) {
            console.error("Error fetching PFPs:", error);
            setAccountProviderPfps([]);
            setNftPfps([]);
            setTotalPfpCount(0);
            setNextPageKeys({});
        } finally {
            setIsPfpsLoading(false);
        }
    };

    const fetchPfps = async (
        network: Network
    ): Promise<WildcardApiResponse> => {
        try {
            const body = {
                nextPageKeys,
                networks: [network],
            };
            const response = await axios.post(FETCH_PFPS_ENDPOINT, body);
            return response.data;
        } catch (error) {
            console.error(`Error fetching PFPs for network ${network}:`, error);
            return { success: false, data: {} };
        }
    };

    useEffect(() => {
        setProfPictureSrc(
            pfpSelected?.imageUrl || getUserProfilePicture(userDB)
        );
    }, [pfpSelected, userDB]);

    return (
        <Flex justifyContent={"center"} mt={"36px"} mb={"36px"}>
            <Box position={"relative"}>
                <Avatar
                    src={profPictureSrc}
                    w={"184px"}
                    h={"184px"}
                    borderWidth="8px"
                    borderStyle={"solid"}
                    borderColor={avatarThemeColor.hexValue}
                    name={connectedUserDBEmail ?? ""}
                />
            </Box>
            <AvatarCollection
                setAvatarThemeColor={setAvatarThemeColor}
                avatarThemeColor={avatarThemeColor}
                handleFetchPfps={handleFetchPfps}
                fetchPfps={fetchPfps}
                accountProviderPfps={accountProviderPfps}
                nftPfps={nftPfps}
                setNftPfps={setNftPfps}
                totalPfpCount={totalPfpCount}
                nextPageKeys={nextPageKeys}
                setNextPageKeys={setNextPageKeys}
                isPfpsLoading={isPfpsLoading}
                pfpSelected={pfpSelected}
                setPfpSelected={setPfpSelected}
                showEditIcon={showEditIcon}
            />
        </Flex>
    );
};

export default ProfilePic;
