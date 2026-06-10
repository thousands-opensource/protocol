import React, { useState } from "react";
import {
    Formik,
    Field,
    Form,
    ErrorMessage,
    FieldProps,
    FormikErrors,
} from "formik";
import DatePicker from "react-datepicker";
import * as Yup from "yup";
import {
    Button,
    ButtonGroup,
    FormControl,
    FormLabel,
    Input,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    Text,
    Textarea,
} from "@chakra-ui/react";
import {
    IUser,
    EventCreationContent,
    EventCreationPayload,
    ISeries,
    GAME_MODE,
} from "@repo/interfaces";
import { getBeamableAccountByUserDB } from "@/utils/accountsUtil";
import { getUserDisplayName } from "@/utils/streamUtils";
import {
    AutoComplete,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteList,
    AutoCompleteGroup,
} from "@choc-ui/chakra-autocomplete";
import "react-datepicker/dist/react-datepicker.css";
import { BEAMABLE_RULE_NAMES } from "@/utils/eventUtil";
import EventFormActions from "./EventFormActions";
import CustomDateInput from "@/components/CustomDateInput";
import FileUpload from "@/components/FileUpload";
import { uploadFileToS3 } from "@/utils/s3Utils";

// Define validation schema
const validationSchema = Yup.object().shape({
    start_date: Yup.mixed().required("required"),
    name: Yup.string().required("Required"),
    seriesId: Yup.string().required("Required"),
    imageUrl: Yup.string().required("Required"),
    phases: Yup.array().of(
        Yup.object().shape({
            rules: Yup.array().of(
                Yup.object().shape({
                    rule: Yup.string(),
                    value: Yup.string().when("rule", {
                        is: (rule: BEAMABLE_RULE_NAMES) =>
                            [
                                BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
                                BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE,
                                BEAMABLE_RULE_NAMES.DESCRIPTION_RULE,
                            ].includes(rule),
                        then: (schema) => schema.required("Required"),
                        otherwise: (schema) => schema.optional(),
                    }),
                })
            ),
        })
    ),
});

export interface EventCreateFormProps {
    onSubmit: (values: EventCreationContent) => void;
    isSubmitted?: boolean;
    users: IUser[];
    initialEvent?: EventCreationPayload | null;
    eventId?: string;
    serverCode: string;
    series: ISeries[];
}

interface FormValues extends EventCreationContent {
    seriesId: string;
    gameMode: GAME_MODE;
    numberOfSkyboxes: number;
}

export const EventForm: React.FC<EventCreateFormProps> = ({
    onSubmit,
    isSubmitted,
    users,
    initialEvent,
    eventId,
    serverCode,
    series,
}) => {
    const [primaryImageFile, setPrimaryImageFile] = useState<File | null>(null);
    const SKYBOX_OPTIONS = [0, 5];
    const [customMode, setCustomMode] = useState(false);

    const initialValues: FormValues = {
        serverCode,
        name: "",
        symbol: "",
        start_date: new Date().toISOString(),
        seriesId: "",
        phases: [
            {
                name: "",
                duration_minutes: "1440", // 24hr
                durationSeconds: 60 * 24 * 60,
                durationMillis: 60 * 24 * 60000,
                rules: [
                    {
                        rule: BEAMABLE_RULE_NAMES.EVENT_TYPE_RULE,
                        value: "",
                    },
                    {
                        rule: BEAMABLE_RULE_NAMES.CAMERA_OPERATOR_RULE,
                        value: "",
                    },
                    {
                        rule: BEAMABLE_RULE_NAMES.DESCRIPTION_RULE,
                        value: "",
                    },
                    {
                        rule: BEAMABLE_RULE_NAMES.INITIAL_FANFARE,
                        value: "defaultarenabillboards.png",
                    },
                ],
            },
        ],
        partition_size: "5",
        permissions: {
            write_self: true,
        },
        score_rewards: [],
        rank_rewards: [],
        group_rewards: {
            scoreRewards: [],
        },
        type: "scheduled",
        recurring: null,
        cohortSettings: {
            cohorts: [],
        },
        imageUrl: initialEvent?.content.imageUrl ?? "",
        durationMinutes: 120,
        billboardImageUrl: "defaultarenabillboards.png",
        gameMode: GAME_MODE.NONE,
        numberOfSkyboxes: 0,
        ...(initialEvent?.content || {}),
    };

    const FORM_CONTROL_SPACING = 4;

    const handleFormSubmit = async (values: FormValues) => {
        try {
            const updatedValues = { ...values };

            // Upload new images if they exist
            if (primaryImageFile) {
                const imageUrl = await uploadFileToS3(primaryImageFile);
                updatedValues.imageUrl = imageUrl;
            }

            console.log(updatedValues.imageUrl);
            await onSubmit(updatedValues);
        } catch (error) {
            console.error("Error uploading images:", error);
            throw error;
        }
    };

    return (
        <Formik
            id="eventformFlex"
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleFormSubmit}
            validate={(values: FormValues) => {
                const errors: FormikErrors<FormValues> = {};
                // make sure cameraoperator is selected (phases.[0].rules[1].value)
                if (!values.phases?.[0]?.rules?.[1]?.value) {
                    errors.phases = [
                        {
                            rules: [{}, { value: "Required" }],
                        },
                    ];
                }
                return errors;
            }}
        >
            {({ setFieldValue, values, isSubmitting }) => {
                console.log(values);

                const handleSelect = (val: number | "custom") => {
                    if (val === "custom") {
                        setCustomMode(true);
                        setFieldValue("numberOfSkyboxes", 0);
                    } else {
                        setCustomMode(false);
                        setFieldValue("numberOfSkyboxes", val);
                    }
                };

                return (
                    <Form style={{ padding: "20px" }}>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Series</FormLabel>
                            <Field
                                name="seriesId"
                                as={Select}
                                isDisabled={isSubmitted}
                            >
                                <option value="">Select series</option>
                                {series.map((s) => (
                                    <option
                                        key={s._id?.toString()}
                                        value={s._id?.toString()}
                                    >
                                        {s.seriesName}
                                    </option>
                                ))}
                            </Field>
                            <Text color="red">
                                <ErrorMessage name="seriesId" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Event Type</FormLabel>
                            <Field
                                name="phases[0].rules[0].value"
                                as={Select}
                                isDisabled={isSubmitted}
                            >
                                <option value="">Select event type</option>
                                <option value="show_match">Show Match</option>
                                <option value="live_event">Live Event</option>
                            </Field>
                            <Text color="red">
                                <ErrorMessage name="phases[0].rules[0].value" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Game Mode</FormLabel>
                            <Field
                                name="gameMode"
                                as={Select}
                                isDisabled={isSubmitted}
                            >
                                <option value="none">None</option>
                                <option value="1v1">1 v 1</option>
                                <option value="2v2">2 v 2</option>
                            </Field>
                            <Text color="red">
                                <ErrorMessage name="gameMode" />
                            </Text>
                        </FormControl>
                        <FormControl mb={4} isDisabled={isSubmitting}>
                            <FormLabel>Number of Skybox</FormLabel>
                            <ButtonGroup isAttached mb={2}>
                                {SKYBOX_OPTIONS.map((val) => (
                                    <Button
                                        key={val}
                                        onClick={() => handleSelect(val)}
                                        variant={
                                            values.numberOfSkyboxes === val &&
                                            !customMode
                                                ? "solid"
                                                : "outline"
                                        }
                                    >
                                        {val}
                                    </Button>
                                ))}
                                <Button
                                    onClick={() => handleSelect("custom")}
                                    variant={customMode ? "solid" : "outline"}
                                >
                                    Custom
                                </Button>
                            </ButtonGroup>

                            {customMode && (
                                <Field name="numberOfSkyboxes">
                                    {({ field }: any) => (
                                        <NumberInput
                                            min={0}
                                            value={field.value}
                                            onChange={(str, numVal) => {
                                                if (str === "") {
                                                    setFieldValue(
                                                        "numberOfSkyboxes",
                                                        ""
                                                    );
                                                } else {
                                                    setFieldValue(
                                                        "numberOfSkyboxes",
                                                        numVal
                                                    );
                                                }
                                            }}
                                            onBlur={() => {
                                                if (
                                                    field.value === "" ||
                                                    isNaN(field.value)
                                                ) {
                                                    setFieldValue(
                                                        "numberOfSkyboxes",
                                                        0
                                                    );
                                                }
                                            }}
                                            isDisabled={isSubmitting}
                                        >
                                            <NumberInputField />
                                        </NumberInput>
                                    )}
                                </Field>
                            )}

                            <Text color="red">
                                <ErrorMessage name="numberOfSkyboxes" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Event Name</FormLabel>
                            <Field
                                name="name"
                                as={Input}
                                isDisabled={isSubmitted}
                            />
                            <Text color="red">
                                <ErrorMessage name="name" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Image</FormLabel>
                            <FileUpload
                                value={primaryImageFile}
                                onChange={(file) => {
                                    setPrimaryImageFile(file);
                                    setFieldValue("imageUrl", file?.name || "");
                                }}
                                onUrlChange={(url) =>
                                    setFieldValue("imageUrl", url)
                                }
                                existingUrl={values.imageUrl}
                            />
                            <Text color="red">
                                <ErrorMessage name="imageUrl" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Description</FormLabel>
                            <Field name="phases[0].rules[2].value">
                                {({ field }: FieldProps) => (
                                    <Textarea
                                        {...field}
                                        id="phases[0].rules[2].value"
                                        disabled={isSubmitted}
                                    />
                                )}
                            </Field>
                            <Text color="red">
                                <ErrorMessage name="phases[0].rules[2].value" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Billboard Image</FormLabel>
                            <Field
                                name="billboardImageUrl"
                                as={Input}
                                isDisabled={isSubmitted}
                            />
                            <Text color="red">
                                <ErrorMessage name="billboardImageUrl" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Start Date and Time</FormLabel>
                            <Field name="start_date">
                                {({ form }: FieldProps) => (
                                    <DatePicker
                                        id="start_date"
                                        selected={
                                            new Date(form.values.start_date)
                                        }
                                        onChange={(date: Date | null) =>
                                            form.setFieldValue(
                                                "start_date",
                                                date
                                            )
                                        }
                                        onBlur={() =>
                                            form.setFieldTouched(
                                                "start_date",
                                                true
                                            )
                                        }
                                        showTimeSelect
                                        timeFormat="h:mm aa"
                                        timeIntervals={15}
                                        dateFormat="MMM d, yyyy h:mm aa"
                                        customInput={
                                            <CustomDateInput
                                                isReadOnly
                                                isDisabled={isSubmitted}
                                                _hover={{
                                                    cursor: isSubmitted
                                                        ? "default"
                                                        : "pointer",
                                                }}
                                            />
                                        }
                                        disabled={isSubmitted}
                                    />
                                )}
                            </Field>
                            <Text color="red">
                                <ErrorMessage name="start_date" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Duration (minutes)</FormLabel>
                            {/*<Input name="durationMinutes" type="number"></Input>*/}
                            <NumberInput
                                maxW="100px"
                                mr="2rem"
                                max={1440}
                                min={10}
                                value={values.durationMinutes}
                                clampValueOnBlur={false}
                                display={"inline-block"}
                                onChange={(val) =>
                                    setFieldValue("durationMinutes", val)
                                }
                            >
                                <NumberInputField name="durationMinutes" />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <Text color="red">
                                <ErrorMessage name="durationMinutes" />
                            </Text>
                        </FormControl>
                        <FormControl mb={FORM_CONTROL_SPACING}>
                            <FormLabel>Camera Operator</FormLabel>
                            <AutoComplete
                                onChange={(val) =>
                                    setFieldValue(
                                        "phases[0].rules[1].value",
                                        val
                                    )
                                }
                                rollNavigation
                                freeSolo
                                value={values.phases[0].rules[1].value}
                            >
                                <AutoCompleteInput
                                    name={"phases[0].rules[1].value"}
                                    isDisabled={isSubmitted}
                                />
                                <AutoCompleteList>
                                    <AutoCompleteGroup>
                                        {users.map((user: IUser) => {
                                            return (
                                                <AutoCompleteItem
                                                    key={`option-${user._id?.toString()}`}
                                                    value={
                                                        getBeamableAccountByUserDB(
                                                            user
                                                        )!.id
                                                    }
                                                    label={getUserDisplayName(
                                                        user
                                                    )}
                                                    textTransform="initial"
                                                    disabled={isSubmitted}
                                                />
                                            );
                                        })}
                                    </AutoCompleteGroup>
                                </AutoCompleteList>
                            </AutoComplete>
                            <Text color="red">
                                <ErrorMessage name="phases[0].rules[1].value" />
                            </Text>
                        </FormControl>
                        <EventFormActions
                            isSubmitted={isSubmitted}
                            eventId={eventId}
                            isSubmitting={isSubmitting}
                            serverCode={serverCode}
                        />
                    </Form>
                );
            }}
        </Formik>
    );
};
