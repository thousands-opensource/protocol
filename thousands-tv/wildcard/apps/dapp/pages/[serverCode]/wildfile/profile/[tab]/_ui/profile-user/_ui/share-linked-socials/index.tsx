import React, { useState } from "react";
import {
    HStack,
    Text,
    Spacer,
    Switch,
    Tooltip,
    IconButton,
} from "@chakra-ui/react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { linkSocialContainer } from "@/components/Navigation/styles";
import axios from "axios";
import { useInfoNotifications } from "@/hooks/useInfoNotifications";
import { useWildfileUserContext } from "@/contexts/globalContextAccounts";
import { IUser, WildcardApiResponse } from "@repo/interfaces";

const textLabelLinkedSocial =
    "Whether to display your linked social information (Discord, Twitter, Twitch, etc) to the rest of the community. This is off by default";

interface LinkedSocialToggleProps {}

const LinkedSocialToggle: React.FC<
    LinkedSocialToggleProps
> = ({}: LinkedSocialToggleProps) => {
    const { userDB, setUserDB } = useWildfileUserContext();
    const { onMessage } = useInfoNotifications();

    const [isShowLinkedSocials, setIsShowLinkedSocials] = useState(
        userDB?.preferences?.showLinkedSocials
    );

    const [updateLinkedSocialSettingError, setUpdateLinkedSocialSettingError] =
        useState<string | undefined>("");

    /**
     * Update the linked socials privacy settings in the database
     * @param _id The user's ID
     * @param showLinkedSocials The new linked socials privacy setting
     */
    async function updateLinkedSocialSettingDB(
        _id: string | undefined,
        showLinkedSocials: boolean
    ) {
        const body = {
            _id: userDB?._id,
            showLinkedSocials,
        };

        const endpoint = "/api/updateLinkedSocialPrivacySetting/";
        try {
            const resp = await axios.post(endpoint, body, {
                headers: {
                    accept: "application/json",
                    "content-type": "application/json",
                },
            });

            const updateLinkedSocialSettingResponse: WildcardApiResponse =
                resp.data;

            if (!updateLinkedSocialSettingResponse.success) {
                setUpdateLinkedSocialSettingError(
                    updateLinkedSocialSettingResponse.err
                );
                setIsShowLinkedSocials(!showLinkedSocials);
                return;
            }

            const updatedUserSettings: IUser =
                updateLinkedSocialSettingResponse.data;

            return updatedUserSettings;
        } catch (error) {
            // Handle the API request error here
            setIsShowLinkedSocials(!showLinkedSocials);
            console.error(error);
            return onMessage({
                description: "Failed to update linked socials privacy settings",
                status: "error",
                position: "bottom",
                duration: 5000,
            });
        }
    }

    const toggleLinkedSocialPrivacy = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!userDB) {
            return onMessage({
                description: "Failed to update linked socials privacy settings",
                status: "error",
                position: "bottom",
                duration: 5000,
            });
        }

        setIsShowLinkedSocials(e.target.checked);

        const updatedSettings = await updateLinkedSocialSettingDB(
            userDB?._id?.toString(),
            e.target.checked
        );

        if (!updatedSettings) {
            return;
        }

        const updatedUserLinkedSocialsPrivacySettingsBool =
            updatedSettings?.preferences?.showLinkedSocials;

        return onMessage({
            description: `Account settings updated. Share Linked Socials: ${
                updatedUserLinkedSocialsPrivacySettingsBool ? "YES" : "NO"
            }`,
            status: "success",
            position: "bottom",
            duration: 5000,
        });
    };

    return (
        <HStack sx={linkSocialContainer}>
            <Text fontSize={"md"}>Share your Linked Socials</Text>
            <Spacer />
            <Switch
                isChecked={isShowLinkedSocials}
                colorScheme="blue"
                size="md"
                onChange={(e) => toggleLinkedSocialPrivacy(e)}
            />
            <Tooltip label={textLabelLinkedSocial}>
                <IconButton
                    icon={<AiOutlineInfoCircle size={23} color={"gray.900"} />}
                    aria-label={textLabelLinkedSocial}
                    variant="unstyled"
                />
            </Tooltip>
        </HStack>
    );
};

export default LinkedSocialToggle;
