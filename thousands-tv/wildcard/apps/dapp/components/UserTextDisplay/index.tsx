import { THEME_COLOR_DARK_GOLD } from "@/constants/constants";
import { Text } from "@chakra-ui/react";

interface UserTextDisplayProps {
    isUserLoggedIn: boolean;
    username: string;
}

const UserTextDisplay = ({
    isUserLoggedIn,
    username,
}: UserTextDisplayProps) => {
    if (!isUserLoggedIn) {
        return (
            <Text color={THEME_COLOR_DARK_GOLD} fontSize={"small"}>
                Not logged in
            </Text>
        );
    }

    return (
        <Text color={THEME_COLOR_DARK_GOLD} fontSize={"small"}>
            {"Logged in: " + username}
        </Text>
    );
};
export default UserTextDisplay;
