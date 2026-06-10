import { Flex, Avatar, Text } from "@chakra-ui/react";

interface TalentAvatarprops {
    avatarImageUrl: string;
    displayName: string;
    role: string;
}
const TalentAvatar = ({
    avatarImageUrl,
    displayName,
    role,
}: TalentAvatarprops) => {
    return (
        <Flex
            id="talent-avatar"
            sx={{
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
            }}
        >
            <Avatar
                sx={{
                    w: "125px",
                    h: "125px",
                }}
                src={avatarImageUrl}
            />
            <Flex
                sx={{
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text
                    sx={{
                        fontSize: "16px",
                    }}
                >
                    {displayName}
                </Text>
                <Text
                    sx={{
                        color: "gray",
                        fontSize: "12px",
                    }}
                >
                    {role}
                </Text>
            </Flex>
        </Flex>
    );
};

export default TalentAvatar;
