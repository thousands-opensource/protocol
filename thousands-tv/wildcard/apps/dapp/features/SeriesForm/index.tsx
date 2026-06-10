import React, { useState } from "react";
import { Form, Field, Formik, FormikHelpers } from "formik";
import "react-datepicker/dist/react-datepicker.css";
import {
    Button,
    Divider,
    Flex,
    HStack,
    Image,
    Link,
    Text,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    FormErrorMessage,
    Code,
    Card,
    useToast,
} from "@chakra-ui/react";
import { FaChevronLeft, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { WILDFILE_ROUTES } from "@/constants/routes";
import { formatRouteConfigUrl } from "@/utils/routeUtil";
import {
    CreateSeriesFormValues,
    SeriesFormValues,
    seriesValidationSchema,
} from "@/features/SeriesForm/interfaces";
import SeriesDateField from "@/features/SeriesForm/SeriesDateField";
import FileUpload from "./ImageUpload";
import { toastDefaultOptions } from "@/constants/constants";
import axios from "axios";
import { uploadFileToS3 } from "@/utils/s3Utils";

interface Props {
    initialValues: SeriesFormValues | CreateSeriesFormValues;
    serverCode: string;
    isCreate?: boolean;
}
const SeriesForm: React.FC<Props> = ({
    serverCode,
    isCreate,
    initialValues,
}) => {
    const [isEditing, setIsEditing] = useState(Boolean(isCreate));

    const toast = useToast();

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(
        null
    );

    const backToSeriesBaseUrl =
        WILDFILE_ROUTES.SERVER.SERIES_DASHBOARD.BASE.url;
    const backToSeriesUrl = formatRouteConfigUrl(backToSeriesBaseUrl, {
        serverCode,
    });

    const endpoint = isCreate
        ? "/api/series/createSeries"
        : "/api/series/updateSeries";

    const handleSubmit = async (
        values: SeriesFormValues | CreateSeriesFormValues,
        formHelpers: FormikHelpers<SeriesFormValues | CreateSeriesFormValues>,
        imageFile: null | File,
        backgroundImageFile: null | File
    ) => {
        try {
            const formData = { ...values };

            // Upload new images if they exist
            if (imageFile instanceof File) {
                const imageUrl = await uploadFileToS3(imageFile);
                formData.imageUrl = imageUrl;
                formHelpers.setFieldValue("imageUrl", imageUrl);
            }

            if (backgroundImageFile instanceof File) {
                const backgroundImageUrl = await uploadFileToS3(
                    backgroundImageFile
                );
                formData.backgroundImageUrl = backgroundImageUrl;
                formHelpers.setFieldValue(
                    "backgroundImageUrl",
                    backgroundImageUrl
                );
            }
            const endDate = new Date(values.endDate);
            endDate.setHours(0, 0, 0, 0);
            const response = await axios.post(endpoint, {
                ...formData,
                startDate: values.startDate.getTime(),
                endDate: values.endDate.getTime(),
            });

            toast({
                ...toastDefaultOptions,
                title: "Success",
                description: `Successfully ${
                    isCreate ? "created" : "updated"
                } series`,
                status: "success",
                duration: 7000,
            });
        } catch (error: any) {
            console.error(
                `Error ${isCreate ? "creating" : "updating"} series:`,
                error
            );
            toast({
                ...toastDefaultOptions,
                title: "Error",
                description: `Failed to ${
                    isCreate ? "create" : "update"
                } series: ${error.response?.data?.message || error}`,
                status: "error",
                duration: 7000,
            });
            setImageFile(null);
            setBackgroundImageFile(null);
            formHelpers.resetForm();
        }

        if (!isCreate) {
            setIsEditing(false);
        }
    };

    return (
        <Card
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            p={8}
            mb={4}
            shadow="md"
            minW={"1280px"}
            _hover={{ shadow: "xl" }}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={seriesValidationSchema}
                onSubmit={(values, formHelpers) =>
                    handleSubmit(
                        values,
                        formHelpers,
                        imageFile,
                        backgroundImageFile
                    )
                }
            >
                {({
                    errors,
                    touched,
                    isSubmitting,
                    resetForm,
                    values,
                    setFieldValue,
                }) => (
                    <Form>
                        <VStack spacing={4} align="stretch">
                            <Flex justify="space-between" align="center">
                                <Link href={backToSeriesUrl}>
                                    <Button
                                        size="sm"
                                        variant="link"
                                        leftIcon={<FaChevronLeft />}
                                        textTransform="uppercase"
                                    >
                                        Back to Series
                                    </Button>
                                </Link>
                                {!isEditing ? (
                                    <Button
                                        leftIcon={<FaEdit />}
                                        onClick={() => setIsEditing(true)}
                                        colorScheme="blue"
                                    >
                                        Edit
                                    </Button>
                                ) : (
                                    <HStack>
                                        <Button
                                            type="submit"
                                            leftIcon={<FaSave />}
                                            colorScheme="green"
                                            isLoading={isSubmitting}
                                        >
                                            Save
                                        </Button>
                                        {!isCreate && (
                                            <Button
                                                leftIcon={<FaTimes />}
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    if (resetForm) resetForm();
                                                }}
                                                colorScheme="red"
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </HStack>
                                )}
                            </Flex>
                            <Divider />

                            <FormControl
                                isInvalid={
                                    !!errors.seriesName && touched.seriesName
                                }
                            >
                                <FormLabel>Series Name</FormLabel>
                                {isEditing ? (
                                    <Field
                                        as={Input}
                                        name="seriesName"
                                        placeholder="Enter series name"
                                    />
                                ) : (
                                    <Text fontSize="2xl">
                                        {values.seriesName}
                                    </Text>
                                )}
                                <FormErrorMessage>
                                    {errors.seriesName}
                                </FormErrorMessage>
                            </FormControl>

                            <Divider />

                            <HStack gap="16">
                                <SeriesDateField
                                    value={values.startDate}
                                    fieldName="startDate"
                                    errors={errors}
                                    touched={touched}
                                    isEditing={isEditing}
                                />
                                <SeriesDateField
                                    value={values.endDate}
                                    fieldName="endDate"
                                    errors={errors}
                                    touched={touched}
                                    isEditing={isEditing}
                                />
                            </HStack>

                            <Divider />

                            <FormControl
                                isInvalid={
                                    !!errors.seriesDescription &&
                                    touched.seriesDescription
                                }
                            >
                                <FormLabel>Description:</FormLabel>
                                {isEditing ? (
                                    <Field
                                        as={Textarea}
                                        name="seriesDescription"
                                        placeholder="Enter series description"
                                    />
                                ) : (
                                    <Text fontSize="lg">
                                        {values.seriesDescription}
                                    </Text>
                                )}
                                <FormErrorMessage>
                                    {errors.seriesDescription}
                                </FormErrorMessage>
                            </FormControl>

                            <Divider />
                            <FormControl
                                isInvalid={
                                    !!errors.seriesPointConfiguration &&
                                    touched.seriesPointConfiguration
                                }
                            >
                                <FormLabel>
                                    Series Point Configuration:
                                </FormLabel>
                                {isEditing ? (
                                    <Field
                                        as={Textarea}
                                        name={"seriesPointConfiguration"}
                                        placeholder={"Enter valid JSON input"}
                                    />
                                ) : (
                                    <Code
                                        display="block"
                                        whiteSpace="pre"
                                        p={4}
                                    >
                                        <Text>
                                            {(() => {
                                                try {
                                                    const parsed =
                                                        values.seriesPointConfiguration
                                                            ? JSON.parse(
                                                                  values.seriesPointConfiguration
                                                              )
                                                            : {};
                                                    return JSON.stringify(
                                                        parsed,
                                                        null,
                                                        2
                                                    );
                                                } catch (e) {
                                                    return (
                                                        values.seriesPointConfiguration ||
                                                        "{}"
                                                    );
                                                }
                                            })()}
                                        </Text>
                                    </Code>
                                )}
                                <FormErrorMessage>
                                    {errors.seriesPointConfiguration}
                                </FormErrorMessage>
                            </FormControl>

                            <Divider />

                            <HStack gap="16">
                                <VStack>
                                    <FormControl
                                        isInvalid={
                                            !!errors.backgroundImageUrl &&
                                            touched.backgroundImageUrl
                                        }
                                    >
                                        <FormLabel>Background Image</FormLabel>
                                        {isEditing ? (
                                            <FileUpload
                                                value={backgroundImageFile}
                                                onChange={(file) => {
                                                    setBackgroundImageFile(
                                                        file
                                                    );
                                                    setFieldValue(
                                                        "backgroundImageUrl",
                                                        file?.name // this is needed for form validation and will get overwritten once the s3 url is returned
                                                    );
                                                }}
                                                onUrlChange={(url) =>
                                                    setFieldValue(
                                                        "backgroundImageUrl",
                                                        url
                                                    )
                                                }
                                                existingUrl={
                                                    values.backgroundImageUrl
                                                }
                                            />
                                        ) : (
                                            <Image
                                                src={values.backgroundImageUrl}
                                                border="1px"
                                                alt="series background image url"
                                                objectFit="contain"
                                                maxH="300px"
                                            />
                                        )}

                                        <FormErrorMessage>
                                            {errors.backgroundImageUrl}
                                        </FormErrorMessage>
                                    </FormControl>
                                </VStack>
                                <VStack>
                                    <FormControl
                                        isInvalid={
                                            !!errors.imageUrl &&
                                            touched.imageUrl
                                        }
                                    >
                                        <FormLabel>Image</FormLabel>
                                        {isEditing ? (
                                            <FileUpload
                                                value={imageFile}
                                                onChange={(file) => {
                                                    setImageFile(file);
                                                    setFieldValue(
                                                        "imageUrl",
                                                        file?.name //// this is needed for form validation and will get overwritten once the s3 url is returned
                                                    );
                                                }}
                                                onUrlChange={(url) =>
                                                    setFieldValue(
                                                        "imageUrl",
                                                        url
                                                    )
                                                }
                                                existingUrl={values.imageUrl}
                                            />
                                        ) : (
                                            <Image
                                                src={values.imageUrl}
                                                border="1px"
                                                alt="series image url"
                                                objectFit="contain"
                                                maxH="300px"
                                            />
                                        )}

                                        <FormErrorMessage>
                                            {errors.imageUrl}
                                        </FormErrorMessage>
                                    </FormControl>
                                </VStack>
                            </HStack>
                        </VStack>
                    </Form>
                )}
            </Formik>
        </Card>
    );
};

export default SeriesForm;
