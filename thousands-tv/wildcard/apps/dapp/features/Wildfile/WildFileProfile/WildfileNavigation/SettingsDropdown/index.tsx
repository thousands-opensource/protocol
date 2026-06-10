import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Menu, MenuButton, IconButton, MenuList } from "@chakra-ui/react";
import * as styles from "./styles";

interface SettingsDropdownProps {
    isLoggedIn: boolean;
}
/**
 * Renders a dropdown component for user settings.
 */
const SettingsDropdown = ({ isLoggedIn }: SettingsDropdownProps) => {
    if (!isLoggedIn) {
        return <></>;
    }
    return (
        <Box ml={1}>
            <Menu
                variant="unstyled" // Set the variant to "unstyled"
            >
                {/* Info icon */}
                <MenuButton
                    color={"white"}
                    as={IconButton}
                    aria-label="Options"
                    icon={<SettingsIcon />}
                    variant="outline"
                    sx={styles.menuSx}
                />

                <MenuList sx={styles.menuListSx}>
                    <Box sx={styles.boxSx} id="box"></Box>
                </MenuList>
            </Menu>
        </Box>
    );
};

export default SettingsDropdown;
