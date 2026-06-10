import { create } from "zustand";
import PubNub from "pubnub";
import { Chat, User } from "@pubnub/chat";
import { createJSONStorage, persist } from "zustand/middleware";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import { useSkyboxStore } from './useSkyboxStore';  // Add this import

// @todo update to 3hrs - default testing 60 sec
const EXPIRATION_TIME = 1000 * 60;

export interface PubnubUser {
    id: string;
    name: string;
    profileUrl: string;
    badgeUrl?: string;
    skyboxId?: string;
    highlightedColor?: string;
}

interface GetUsersState {
    users: PubnubUser[];
    formatPubnubUser: (
        id: string,
        name: string | undefined,
        profileUrl: string | undefined
    ) => PubnubUser;
    getUser: (id: string) => PubnubUser | null;
    setUsers: (users: PubnubUser[] | (() => PubnubUser[])) => void;
    fetchUsers: (pubnub: Chat) => Promise<void>;
    updateUsers: (pubnub: Chat, unknownUserIds: string[]) => Promise<void>;
    updateUserSkyboxes: (userIds: string[], skyboxId: string, highlightedColor: string) => void;
}

export const useGetUsersStore = create<GetUsersState>()(
    persist(
        (set, get) => ({
            users: [],
            formatPubnubUser: (
                id: string,
                name: string | undefined,
                profileUrl: string | undefined
            ) => {
                //Remmed out the following line and added the line after to fix dice bear avatars.  This could cause issues with other avatar Url's
                //const formattedProfileUrl = profileUrl?.trim()?.split("?")[0];

                const skyboxes = useSkyboxStore.getState().skyboxes;
                const userSkybox = skyboxes.find(skybox =>
                    skybox.skyboxChannelMembers?.includes(id)
                );

                const formattedProfileUrl = profileUrl;
                console.log(formattedProfileUrl);
                return {
                    id,
                    name: name || "Anonymous",
                    profileUrl: profileUrl || Silhoutte.src,
                    badgeUrl: userSkybox?.skyboxLogoUrl,
                    skyboxId: userSkybox?._id?.toString(),
                    highlightedColor: userSkybox?.skyboxPrimaryColor
                };
            },
            getUser: (id: string) => {
                const user = get().users.find((user) => user.id === id);
                if (!user) {
                    return null;
                }

                return user;
            },
            setUsers: (users: PubnubUser[] | (() => PubnubUser[])) => {
                set((state) => ({
                    users: (typeof users === "function" ? users() : users).map((user) => {
                        return get().formatPubnubUser(
                            user.id,
                            user.name,
                            user.profileUrl
                        );
                    })
                }));
            },
            fetchUsers: async (pubnub: Chat) => {
                try {
                    let prevKey;
                    let nextKey;
                    const allUsers: User[] = [];
                    do {
                        let options = {};

                        if (nextKey) {
                            options = { ...options, page: { next: nextKey } };
                        }
                        const getUserResponse = await pubnub.getUsers(options);

                        if (getUserResponse.page) {
                            if (getUserResponse.users) {
                                allUsers.push(...getUserResponse.users);
                            }
                            prevKey = getUserResponse.page.prev;
                            nextKey = getUserResponse.page.next;
                        }
                    } while (nextKey !== prevKey);

                    const newUsersMap = new Map();
                    console.log('newUsersMap2222222', newUsersMap);
                    get().users.forEach((user: PubnubUser) =>
                        newUsersMap.set(user.id, user)
                    );
                    allUsers.forEach((user: User) => {
                        const pubnubUser = get().formatPubnubUser(
                            user.id,
                            user.name,
                            user.profileUrl
                        );

                        newUsersMap.set(user.id, pubnubUser);
                    });
                    console.log('newUsersMap333333', newUsersMap);
                    set({
                        users: Array.from(newUsersMap.values()) as PubnubUser[],
                    });
                } catch (error) {
                    console.error("Error fetching users:", error);
                }
            },
            updateUsers: async (pubnub: Chat, unknownUserIds: string[]) => {
                const currentUsers = get().users.map((user) => user.id);

                //console.log('current users', currentUsers)
                const idList = unknownUserIds.filter(
                    (id) => !currentUsers.includes(id)
                );
                if (idList.length === 0) {
                    return;
                }
                const BATCH_SIZE = 50;
                const batchedUsers: User[] = [];

                // Fetch user details in batches
                for (let i = 0; i < idList.length; i += BATCH_SIZE) {
                    const chunk = idList.slice(i, i + BATCH_SIZE);

                    try {
                        let prevKey;
                        let nextKey;
                        do {
                            let options: PubNub.GetAllMetadataParameters = {
                                filter: `id=='${chunk.join("' || id=='")}'`,
                            };

                            if (nextKey) {
                                options = {
                                    ...options,
                                    page: { next: nextKey },
                                };
                            }
                            const getUserResponse = await pubnub.getUsers(
                                options
                            );

                            if (getUserResponse.page) {
                                if (getUserResponse.users) {
                                    batchedUsers.push(...getUserResponse.users);
                                }
                                prevKey = getUserResponse.page.prev;
                                nextKey = getUserResponse.page.next;
                            }
                        } while (nextKey !== prevKey);
                    } catch (e: any) {
                        console.error(
                            `Error fetching user details in batch number ${Math.floor(
                                i / BATCH_SIZE
                            )} `,
                            e
                        );
                    }
                }
                if (batchedUsers.length > 0) {
                    const newUsersMap = new Map();
                    get().users.forEach((user: PubnubUser) =>
                        newUsersMap.set(user.id, user)
                    );
                    console.log('newUsersMap2', newUsersMap);
                    batchedUsers.forEach((user: User) => {
                        const pubnubUser = get().formatPubnubUser(
                            user.id,
                            user.name,
                            user.profileUrl
                        );
                        newUsersMap.set(user.id, pubnubUser);
                    });
                    console.log('newUsersMap3', newUsersMap);
                    const updatedUsers = Array.from(
                        newUsersMap.values()
                    ) as PubnubUser[];
                    set({ users: updatedUsers });
                }
            },
            updateUserSkyboxes: (userIds: string[], skyboxId: string, highlightedColor: string) => {
                set((state) => {
                    console.log("updateUserSkyboxes", userIds, skyboxId, highlightedColor, state.users.map(user =>
                        userIds.includes(user.id)
                            ? { ...user, skyboxId, highlightedColor }
                            : user
                    ));

                    return {
                        users: state.users.map(user =>
                            userIds.includes(user.id)
                                ? { ...user, skyboxId, highlightedColor }
                                : user
                        )
                    }
                });
            },
        }),
        {
            name: "pubnub-users",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
