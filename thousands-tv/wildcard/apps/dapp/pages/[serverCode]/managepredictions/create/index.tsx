import { Button, Card, Flex, FormControl, FormLabel, Icon, Input, Stack, useToast, VStack } from "@chakra-ui/react";
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
import { formatRouteConfigUrl } from "../../../../utils/routeUtil";
import axiosAuthClientInstance from "../../../../lib/axiosAuthClientInstance";
import { FaChevronLeft } from "react-icons/fa";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { v4 as uuidv4 } from 'uuid';


interface CreateRallyPredictionProps {
    serverCode: string;
}

function CreateRallyPrediction({ serverCode }: CreateRallyPredictionProps) {
    const router = useRouter();
    const toast = useToast();
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect back to forecasts list
    const backToRallyPredictionsUrl = formatRouteConfigUrl(
        WILDFILE_ROUTES.SERVER.MANAGE_PREDICTIONS_DASHBOARD.BASE.url,
        { serverCode }
    );

    const [formData, setFormData] = useState({
        title: "",
        subTitle: "",
        optionAText: "Decrease", 
        optionBText: "Increase", 
        optionAButtonColor: "#d70000", 
        optionBButtonColor: "#0072fe",
        imageUrl: "",
        cmsId: uuidv4(),
        maxCreditSpend: 0,
        wcAmount: 0,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                endDate: endDate.toISOString(),
            };

            // Upload image to S3 if a new file was selected
            if (imageFile) {
                const imageUrl = await uploadFileToS3(imageFile);
                payload.imageUrl = imageUrl;
            }

            await axiosAuthClientInstance.post("/api/rallyPredictions/createRallyPrediction", payload);

            toast({
                title: "Rally prediction created successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            router.push(backToRallyPredictionsUrl);
        } catch (error) {
            console.error("Error creating rally prediction:", error);
            toast({
                title: "Error creating rally prediction",
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
                            onClick={() => router.push(backToRallyPredictionsUrl)}
                        >
                            Back to Rally Predictions
                        </Button>
                    </Flex>

                    <form onSubmit={handleSubmit}>
                        <Stack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Title</FormLabel>
                                <Input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction title"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Subtitle</FormLabel>
                                <Input
                                    name="subTitle"
                                    value={formData.subTitle}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction subtitle"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option A Text</FormLabel>
                                <Input
                                    name="optionAText"
                                    value={formData.optionAText}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option A text"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option B Text</FormLabel>
                                <Input
                                    name="optionBText"
                                    value={formData.optionBText}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option B text"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option A Button Color</FormLabel>
                                <Input
                                    name="optionAButtonColor"
                                    value={formData.optionAButtonColor}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option A button color"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Option B Button Color</FormLabel>
                                <Input
                                    name="optionBButtonColor"
                                    value={formData.optionBButtonColor}
                                    onChange={handleInputChange}
                                    placeholder="Enter rally prediction option B button color"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>CMS ID</FormLabel>
                                <Input
                                    name="cmsId"
                                    value={formData.cmsId}
                                    onChange={handleInputChange}
                                    placeholder="Enter CMS ID"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Maximum Credit Spend</FormLabel>
                                <Input
                                    name="maxCreditSpend"
                                    value={formData.maxCreditSpend}
                                    onChange={handleInputChange}
                                    placeholder="Enter a number of credits"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>$WC Amount to Distribute</FormLabel>
                                <Input
                                    name="wcAmount"
                                    value={formData.wcAmount}
                                    onChange={handleInputChange}
                                    placeholder="Enter a number of WC tokens"
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel>Image</FormLabel>
                                <FileUpload
                                    value={imageFile}
                                    onChange={(file) => {
                                        setImageFile(file);
                                        setFormData(prev => ({
                                            ...prev,
                                            imageUrl: file?.name || ""
                                        }));
                                    }}
                                    onUrlChange={(url) => 
                                        setFormData(prev => ({
                                            ...prev,
                                            imageUrl: url
                                        }))
                                    }
                                    existingUrl={formData.imageUrl}
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Start Date</FormLabel>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date: Date | null) => date && setStartDate(date)}
                                    dateFormat="MMMM d, yyyy"
                                    className="chakra-input css-1kp110w"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>End Date</FormLabel>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date: Date | null) => date && setEndDate(date)}
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
                                Create Forecast
                            </Button>
                        </Stack>
                    </form>
                </Card>
            </VStack>
        </EventLayout>
    );
}

export default CreateRallyPrediction;

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
