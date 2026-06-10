import React from "react";
import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteList,
    AutoCompleteGroup,
} from "@choc-ui/chakra-autocomplete";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { getUserDisplayName } from "@/utils/streamUtils";
import { IUser } from "@repo/interfaces";

interface UserAutoCompleteProps {
    users: IUser[];
    onChange: (value: string) => void;
    isDisabled?: boolean;
    value?: string;
}

/**
 * AutoComplete component for selecting a user
 */
const UserAutoComplete: React.FC<UserAutoCompleteProps> = ({
    users,
    onChange,
    isDisabled = false,
    value = "",
}) => {
    return (
        <AutoComplete onChange={onChange} rollNavigation freeSolo value={value}>
            <AutoCompleteInput
                name="user"
                isDisabled={isDisabled}
                placeholder="Select a user"
            />
            <AutoCompleteList>
                <AutoCompleteGroup>
                    {users.map((user: IUser) => {
                        const userId =
                            getBeamableAccountByUserDB(user)?.id ||
                            getUserDisplayName(user);

                        return (
                            <AutoCompleteItem
                                key={`option-${user._id?.toString()}`}
                                value={user?._id?.toString()}
                                label={getUserDisplayName(user)}
                                textTransform="initial"
                            />
                        );
                    })}
                </AutoCompleteGroup>
            </AutoCompleteList>
        </AutoComplete>
    );
};

export default UserAutoComplete;
