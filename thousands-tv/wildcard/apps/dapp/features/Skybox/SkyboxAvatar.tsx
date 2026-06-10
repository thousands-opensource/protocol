import { useEffect, useMemo, useState } from "react";
import Silhoutte from "@/public/images/WildfileAssets/silhoutte.webp";
import Image from "next/image";
import { useGetUsersStore } from "@/store/useGetUsersStore";
import { SkyboxFan } from "./types";
import { useUserMetaContext } from "@/contexts/userMetaContext";

interface SkyboxAvatarProps {
    skyboxFan: SkyboxFan;
    isSkyboxOwner: boolean;
    isLast: boolean;
    inviteFlag?: boolean;
}

const SkyboxAvatar = ({
    skyboxFan,
    isSkyboxOwner,
    isLast,
    inviteFlag = false,
}: SkyboxAvatarProps) => {
    const [displayName, setDisplayName] = useState<string>("Anonymous");
    const [pfpUrl, setPfpUrl] = useState<string>("");
    const { getUserMetadata } = useUserMetaContext();
    const getUser = useGetUsersStore((state) => state.getUser);
    const foundUser = useMemo(
        () => (skyboxFan.id ? getUser(skyboxFan.id) : null),
        [skyboxFan.id, getUser]
    );

    const getDisplayNameAndPfpUrl = async (userId: string) => {
        if (foundUser) {
            const { name, profileUrl } = foundUser;
            setDisplayName((prev) => name || prev);
            setPfpUrl((prev) => profileUrl || prev);
            return;
        }

        const result = await getUserMetadata(userId);
        setDisplayName((prev) => result?.name || prev);
        setPfpUrl((prev) => result?.profileUrl || prev);
    };

    const renderAvatar = () => {
        if (!inviteFlag) {
            return (
                <>
                    {pfpUrl && (
                        <Image
                            src={pfpUrl}
                            alt={displayName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                            unoptimized={!pfpUrl.includes(".svg")}
                        />
                    )}
                </>
            );
        }

        return pfpUrl ? (
            <Image
                src={pfpUrl}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized={!pfpUrl.includes(".svg")}
            />
        ) : (
            <span className="text-gray-200 text-sm ">+</span>
        );
    };

    useEffect(() => {
        if (skyboxFan.id) {
            getDisplayNameAndPfpUrl(skyboxFan.id);
        }
    }, [skyboxFan.id]);

    return (
        <>
            {skyboxFan.id && (
                <div
                    className={`absolute ${
                        isLast ? "right-[-50%] translate-x-0" : "left-[-50%]"
                    } bottom-full mb-1 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap`}
                >
                    {displayName}
                    {/* Triangle pointer pointing down */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[4px] border-transparent border-t-gray-900"></div>
                </div>
            )}
            {/* Member avatar or empty slot */}
            <div
                className={`w-full h-full rounded-full flex items-center justify-center ${
                    isSkyboxOwner ? "cursor-pointer" : "none"
                } ${
                    inviteFlag ? "bg-[#444444]" : "bg-gray-500"
                } overflow-hidden`}
            >
                {renderAvatar()}
            </div>
        </>
    );
};

export default SkyboxAvatar;
