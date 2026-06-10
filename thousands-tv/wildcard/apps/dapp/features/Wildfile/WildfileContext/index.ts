import {
    DiscordRole,
    ILeaderboard,
    ILeaderBoardCount,
    ISwagSet,
    UserLeaderboardPosition,
} from "@repo/interfaces";
import { ActivityLog } from "@repo/interfaces";
import { OwnedNft } from "alchemy-sdk";
import { createContext, Dispatch, SetStateAction } from "react";
import { ClaimedSwagSet, IBadge, IUser, PfpMetadata } from "@repo/interfaces";
import { IShowdown, ShowdownEvent } from "@/db/schemas/showdownSchema";

interface WildfileContextInterface {
    setPageOwnerUser: Dispatch<SetStateAction<IUser>>;
    pageOwnerUser: IUser;
    wildpasses: OwnedNft[];
    userActivity: ActivityLog[];
    setUserActivity: Dispatch<SetStateAction<ActivityLog[]>>;
    swagPins: OwnedNft[];
    pastShowdownEvents: ShowdownEvent[];
    upcomingShowdownEvents: ShowdownEvent[];
    currentShowdownEvent: ShowdownEvent | null;
    activeShowdown: IShowdown | null;
    userDiscordRoles: DiscordRole[];
    totalUniqueSwagPins: number;
    favoritePfps: PfpMetadata[];
    setFavoritePfps: Dispatch<SetStateAction<PfpMetadata[]>>;
    pfp: PfpMetadata;
    setPfp: Dispatch<SetStateAction<PfpMetadata>>;
    swagSets: ISwagSet[];
    claimedSwagSets: ClaimedSwagSet[];
    setClaimedSwagSets: Dispatch<SetStateAction<ClaimedSwagSet[]>>;
    setSwagPins: Dispatch<SetStateAction<OwnedNft[]>>;
    setWildpasses: Dispatch<SetStateAction<OwnedNft[]>>;
    setLeaderboards: Dispatch<SetStateAction<ILeaderboard[]>>;
    leaderboards: ILeaderboard[];
    pageOwnerLeaderboardPositions: UserLeaderboardPosition[];
    leaderboardCounts: ILeaderBoardCount[];
    badges: IBadge[];
    setSelectedBadge: (badge: IBadge) => void;
    selectedBadge: IBadge;
    setActiveWildfileTab: Dispatch<SetStateAction<number>>;
    activeWildfileTab: number;
}
const ProfileContext = createContext<WildfileContextInterface>(
    {} as WildfileContextInterface
);

export default ProfileContext;
