import { IUser } from "@repo/interfaces";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Button,
    useToast,
    Input,
    FormControl,
    FormErrorMessage,
    HStack,
} from "@chakra-ui/react";
import axios from "axios";
import { Field, Form, Formik, FieldProps } from "formik";
import React, { Dispatch, SetStateAction, useState } from "react";
import { getUserDisplayName } from "@/utils/streamUtils";
import {
    displayNameValidationSchema,
    UserNameFormValues,
} from "@/features/Wildfile/WildFileProfile/WildfileAccountsFlowPopups/PopupWildfileSocialsModal/_ui/UpdateDisplayNameForm";

/**
 * Rename User Modal
 */
const RenameUserModal: React.FC<{
    userToRename?: IUser;
    setUserToRename: Dispatch<SetStateAction<IUser | undefined>>;
    refreshLeaderBoard: () => Promise<void>;
}> = ({ userToRename, setUserToRename, refreshLeaderBoard }) => {
    const toast = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOpen = !!userToRename;
    const displayName = getUserDisplayName(userToRename);
    const onClose = () => {
        setUserToRename(undefined);
    };

    const handleSubmit = async (values: UserNameFormValues) => {
        setIsSubmitting(true);
        try {
            await axios.post(
                `/api/accounts/admin/user/setDisplayName`,
                {
                    displayName: values.name,
                    userId: userToRename?._id?.toString(),
                },
                {
                    headers: {
                        accept: "application/json",
                        "content-type": "application/json",
                    },
                }
            );
            await refreshLeaderBoard();

            toast({
                title: "User Has Successfully been Renamed",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            onClose();
        } catch (error: any) {
            toast({
                title: "Failed to rename user.",
                description: error.response?.data?.message || "",
                status: "error",
                duration: 20000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Rename User{` "${displayName}"`}</ModalHeader>
                <ModalCloseButton disabled={isSubmitting} />
                <ModalBody>
                    <Formik
                        initialValues={{ name: "" }}
                        onSubmit={handleSubmit}
                        validationSchema={displayNameValidationSchema}
                    >
                        <Form>
                            <Field name="name">
                                {({
                                    field,
                                    meta,
                                }: FieldProps<string, UserNameFormValues>) => (
                                    <FormControl
                                        isInvalid={meta.touched && !!meta.error}
                                    >
                                        <Input
                                            {...field}
                                            id="name"
                                            placeholder="New User Name"
                                            isReadOnly={isSubmitting}
                                        />
                                        <FormErrorMessage>
                                            {meta.error}
                                        </FormErrorMessage>
                                    </FormControl>
                                )}
                            </Field>
                            <HStack justifyContent={"center"} mt={9}>
                                <Button
                                    variant="ghost"
                                    mr={3}
                                    onClick={onClose}
                                    isDisabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    colorScheme="green"
                                    isLoading={isSubmitting}
                                >
                                    Save
                                </Button>
                            </HStack>
                        </Form>
                    </Formik>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default RenameUserModal;
