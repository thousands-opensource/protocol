import { Input, InputProps } from "@chakra-ui/react";
import React from "react";

interface CustomDateInputProps extends Omit<InputProps, "value"> {
    value?: string;
}

const CustomDateInput = React.forwardRef<
    HTMLInputElement,
    CustomDateInputProps
>(({ value, ...restProps }, ref) => (
    <Input
        ref={ref}
        value={value}
        placeholder="Select date and time"
        minW={restProps.width || "300px"}
        {...restProps}
    />
));
CustomDateInput.displayName = "CustomDateInput";
export default CustomDateInput;
