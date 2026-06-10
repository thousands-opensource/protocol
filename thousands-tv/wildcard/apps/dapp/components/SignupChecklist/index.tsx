import {
    MIN_PASSWORD_LENGTH,
    VERIFICAITON_CODE_LENGTH,
} from "@/constants/constants";
import { List, ListIcon, ListItem } from "@chakra-ui/react";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { MdCheckBox } from "react-icons/md";

interface Props {
    code: string;
    password: string;
}
const SignUpChecklist: React.FC<Props> = ({ code, password }) => {
    return (
        <List spacing={3}>
            <ListItem>
                <ListIcon as={MdCheckBox} boxSize={5} />A verification code has
                been sent to your email.
            </ListItem>
            <ListItem>
                <ListIcon
                    boxSize={5}
                    as={
                        code.length === VERIFICAITON_CODE_LENGTH
                            ? MdCheckBox
                            : MdCheckBoxOutlineBlank
                    }
                />
                Enter the verification code from your email.
            </ListItem>
            <ListItem>
                <ListIcon
                    boxSize={5}
                    as={
                        password.length >= MIN_PASSWORD_LENGTH
                            ? MdCheckBox
                            : MdCheckBoxOutlineBlank
                    }
                />
                Create a new password (minimum 9 characters) to access the
                Wildcard game.
            </ListItem>
        </List>
    );
};

export default SignUpChecklist;
