import { Button, Card, Flex, FormControl, FormLabel, Icon, Input, Select, Stack, useToast, VStack } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/router";
import FileUpload from "../../../../components/FileUpload";
import { uploadFileToS3 } from "../../../../utils/s3Utils";
import EventLayout from "../../../../layouts/EventLayout";
import { AuthorizedUserData } from "../../../../utils/backend/sessionServerUtil";
import { checkUserAuthorizedForPage } from "../../../../utils/profileUtil";
import { WILDFILE_ROUTES } from "../../../../constants/routes";
import { formatRouteConfigUrl } from "../../../../utils/routeUtil";
import axiosAuthClientInstance from "../../../../lib/axiosAuthClientInstance";
import { FaChevronLeft } from "react-icons/fa";

interface CreateIdentityProps {
    serverCode: string;
}

function CreateIdentity({ serverCode }: CreateIdentityProps) {
    const router = useRouter();
    const toast = useToast();
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect back to identities list
    const backToIdentitiesUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.IDENTITY_DASHBOARD.BASE.url,
        { serverCode }
    );

    const [formData, setFormData] = useState({
        identityName: "",
        identityRole: "",
        showAsTalent: false,
        identityPfpImageUrl: "",
        identityType: "",
        supportTokenContractAddress: ""
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                startDate: startDate.toISOString(),
                // Only include supportTokenContractAddress if it has a value
                ...(formData.supportTokenContractAddress && {
                    supportTokenContractAddress: formData.supportTokenContractAddress
                })
            };

            // Upload image to S3 if a new file was selected
            if (imageFile) {
                const imageUrl = await uploadFileToS3(imageFile);
                payload.identityPfpImageUrl = imageUrl;
            }

            await axiosAuthClientInstance.post("/api/identities/addIdentity", payload);

            toast({
                title: "Identity created successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            router.push(backToIdentitiesUrl);
        } catch (error) {
            console.error("Error creating identity:", error);
            toast({
                title: "Error creating identity",
                description: "Please try again",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <EventLayout>
            <VStack spacing={8} width="100%" maxW="600px" mx="auto" pt="2rem">
                <Card p={8} width="100%" border="1px gray solid">
                    <Flex justify="flex-start" mb={4}>
                        <Button
                            size="sm"
                            variant="link"
                            leftIcon={<Icon as={FaChevronLeft} />}
                            onClick={() => router.push(backToIdentitiesUrl)}
                        >
                            Back to Identities
                        </Button>
                    </Flex>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Identity Name</FormLabel>
                                <Input
                                    name="identityName"
                                    value={formData.identityName}
                                    onChange={handleInputChange}
                                    placeholder="Enter identity name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Identity Type</FormLabel>
                                <Select
                                    name="identityType"
                                    value={formData.identityType}
                                    onChange={handleInputChange}
                                    placeholder="Select identity type"
                                >
                                    <option value="person">Person</option>
                                    <option value="organization">Organization</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Identity Role</FormLabel>
                                <Input
                                    name="identityRole"
                                    value={formData.identityRole}
                                    onChange={handleInputChange}
                                    placeholder="Enter identity role"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Show as Talent?</FormLabel>
                                <Select
                                    name="showAsTalent"
                                    value={formData.showAsTalent.toString()}
                                    onChange={handleInputChange}
                                    placeholder="Select identity type"
                                >
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </Select>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Profile Image</FormLabel>
                                <FileUpload
                                    value={imageFile}
                                    onChange={(file) => {
                                        setImageFile(file);
                                        setFormData(prev => ({
                                            ...prev,
                                            identityPfpImageUrl: file?.name || ""
                                        }));
                                    }}
                                    onUrlChange={(url) => 
                                        setFormData(prev => ({
                                            ...prev,
                                            identityPfpImageUrl: url
                                        }))
                                    }
                                    existingUrl={formData.identityPfpImageUrl}
                                />
                            </FormControl>
                            {/*
                            <FormControl>
                                <FormLabel>Support Token Contract Address (Optional)</FormLabel>
                                <Input
                                    name="supportTokenContractAddress"
                                    value={formData.supportTokenContractAddress}
                                    onChange={handleInputChange}
                                    placeholder="Enter token contract address"
                                />
                            </FormControl>
                            */}
                            <FormControl isRequired>
                                <FormLabel>Start Date</FormLabel>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => date && setStartDate(date)}
                                    dateFormat="MMMM d, yyyy"
                                    className="chakra-input css-1kp110w"
                                />
                            </FormControl>

                            <Button
                                mt={4}
                                colorScheme="blue"
                                type="submit"
                                isLoading={isSubmitting}
                                width="100%"
                            >
                                Create Identity
                            </Button>
                        </Stack>
                    </form>
                </Card>
            </VStack>
        </EventLayout>
    );
}

export default CreateIdentity;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const userAuthorizedForPageResult = await checkUserAuthorizedForPage(context);

    if (!userAuthorizedForPageResult.success) {
        return userAuthorizedForPageResult.data as {
            redirect: { destination: string; permanent: boolean };
        };
    }

    const authorizedUserData: AuthorizedUserData =
        userAuthorizedForPageResult.data as AuthorizedUserData;

    const serverCode = authorizedUserData.serverDoc?.serverCode;

    return {
        props: {
            serverCode,
        },
    };
};
