import {
    createContext,
    Dispatch,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import { Chat, User } from "@pubnub/chat";
import { ThreadItem } from "@/types/chat";
import { PubnubUser, useGetUsersStore } from "@/store/useGetUsersStore";

interface UserMetaProviderProps {
    pubnub: Chat;
    children?: ReactNode;
}

interface InFlightUserMetadata {
    userId: string;
    promise: Promise<User | null>;
}

interface UserMetaInterface {
    users: PubnubUser[];
    threadList: ThreadItem[];
    setUsers: (users: PubnubUser[]) => void;
    pubnub: Chat;
    handleThreadsList: (thread: ThreadItem) => void;

    getUserMetadata: (userId: string) => Promise<any>;
}

const UserMetaContext = createContext<UserMetaInterface>(
    {} as UserMetaInterface
);

const useUserMetaContext = () => {
    const context = useContext(UserMetaContext);
    if (!context) {
        throw new Error(
            "useUserMetaContext must be used within an [streamId].tsx"
        );
    }
    return context;
};

const UserMetaProvider = ({ pubnub, children }: UserMetaProviderProps) => {
    // const [users, setUsers] = useState<User[]>([]);
    const { users, setUsers, updateUsers } = useGetUsersStore();
    const [threadList, setThreadList] = useState<ThreadItem[]>([]);

    const userMetadataRequestInflightHashMap = useMemo(
        () => new Map<string, InFlightUserMetadata>(),
        []
    );

    const handleThreadsList = useCallback(
        (thread: ThreadItem) => {
            setThreadList((prevThreadList) => {
                const filteredList = prevThreadList.filter(
                    (t) =>
                        t.channel.id !== thread.channel.id &&
                        t.timetoken !== thread.timetoken
                );

                return [thread, ...filteredList];
            });
        },
        [setThreadList]
    );

    const getUserMetadata = useCallback(
        async (userId: string) => {
            //check if the userId already has an inflight API call
            if (!userMetadataRequestInflightHashMap.get(userId)) {
                var getUsersPromise = pubnub.getUser(userId);
                const inflightUserMetadata: InFlightUserMetadata = {
                    userId,
                    promise: getUsersPromise,
                };
                userMetadataRequestInflightHashMap.set(
                    userId,
                    inflightUserMetadata
                );

                const updateUsersPromise = updateUsers(pubnub, [userId]);
                const [result, _] = await Promise.all([
                    getUsersPromise,
                    updateUsersPromise,
                ]);
                userMetadataRequestInflightHashMap.delete(userId);
                return result;
            }

            return userMetadataRequestInflightHashMap.get(userId)?.promise;
        },
        [userMetadataRequestInflightHashMap]
    );

    const userMetaState = useMemo(
        () => ({
            users,
            setUsers,
            threadList,
            handleThreadsList,
            pubnub,

            getUserMetadata,
        }),
        [
            users,
            threadList,
            setUsers,
            handleThreadsList,
            pubnub,
            getUserMetadata,
        ]
    );

    return (
        <UserMetaContext.Provider value={userMetaState}>
            {children}
        </UserMetaContext.Provider>
    );
};

export default UserMetaProvider;
export { useUserMetaContext };
