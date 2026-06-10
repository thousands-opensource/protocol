// components/FileUpload.tsx
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Image, Text, VStack, CloseButton, theme } from "@chakra-ui/react";

interface FileUploadProps {
    value: string | File | null;
    onChange: (file: File | null) => void;
    onUrlChange: (url: string) => void;
    existingUrl?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    value,
    onChange,
    onUrlChange,
    existingUrl,
}) => {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles?.[0]) {
                onChange(acceptedFiles[0]);
            }
        },
        [onChange]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [".jpeg", ".jpg", ".png", ".gif"],
        },
        maxSize: 5000000, // 5MB
        multiple: false,
    });

    const clearFile = () => {
        onChange(null);
        onUrlChange("");
    };

    const previewUrl =
        value instanceof File ? URL.createObjectURL(value) : existingUrl || "";

    return (
        <Box width="100%">
            <Box
                {...getRootProps()}
                borderWidth={2}
                borderStyle="dashed"
                borderRadius="md"
                p={4}
                cursor="pointer"
                bg={"transparent"}
            >
                <input {...getInputProps()} />
                <VStack spacing={2}>
                    {previewUrl ? (
                        <Box position="relative" width="100%">
                            <Image
                                src={previewUrl}
                                alt="Preview"
                                maxH="300px"
                                objectFit="contain"
                            />
                            <CloseButton
                                position="absolute"
                                backgroundColor={theme.colors.gray[600]}
                                top={0}
                                right={0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearFile();
                                }}
                            />
                        </Box>
                    ) : (
                        <Text textAlign="center">
                            {isDragActive
                                ? "Drop the file here"
                                : "Drag & drop an image here, or click to select"}
                        </Text>
                    )}
                </VStack>
            </Box>
        </Box>
    );
};

export default FileUpload;
