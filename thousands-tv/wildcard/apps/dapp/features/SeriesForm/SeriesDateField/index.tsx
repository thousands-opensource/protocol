import CustomDateInput from "@/components/CustomDateInput";
import { colors } from "@/theme/foundations";
import {
    Flex,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Text,
    Icon,
} from "@chakra-ui/react";
import { Field, FieldProps, FormikErrors, FormikTouched } from "formik";
import DatePicker from "react-datepicker";
import { FaRegCalendarAlt } from "react-icons/fa";
import { CreateSeriesFormValues, SeriesFormValues } from "../interfaces";

interface Props {
    value: Date;
    fieldName: "startDate" | "endDate";
    errors: FormikErrors<SeriesFormValues | CreateSeriesFormValues>;
    touched: FormikTouched<SeriesFormValues | CreateSeriesFormValues>;
    isEditing: boolean;
}
const SeriesDateField: React.FC<Props> = ({
    value,
    fieldName,
    errors,
    touched,
    isEditing,
}) => {
    return (
        <FormControl
            isInvalid={!!errors[fieldName] && touched[fieldName] !== undefined}
        >
            <FormLabel>
                {" "}
                <Icon as={FaRegCalendarAlt} />{" "}
                {fieldName === "startDate" ? "Start" : "End"} Date
            </FormLabel>
            {isEditing ? (
                <Field name={fieldName}>
                    {({ form }: FieldProps) => (
                        <DatePicker
                            selected={value}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    form.setFieldValue(fieldName, date);
                                }
                            }}
                            showTimeSelect
                            timeFormat="h:mm aa"
                            timeIntervals={15}
                            dateFormat="MMM d, yyyy h:mm aa"
                            customInput={
                                <CustomDateInput
                                    width={"fit-content"}
                                    _hover={{
                                        cursor: "pointer",
                                        borderColor: colors.primary[500],
                                    }}
                                    value={value.toLocaleString()}
                                    cursor={isEditing ? "pointer" : "default"}
                                    isDisabled={!isEditing}
                                />
                            }
                        />
                    )}
                </Field>
            ) : (
                <Flex alignItems="center" gap={2}>
                    <Text fontSize="md">
                        {value.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                        })}
                    </Text>
                </Flex>
            )}
            <FormErrorMessage>
                {errors[fieldName] && typeof errors[fieldName] === "string"
                    ? `${errors[fieldName]}`
                    : null}
            </FormErrorMessage>
        </FormControl>
    );
};

export default SeriesDateField;
