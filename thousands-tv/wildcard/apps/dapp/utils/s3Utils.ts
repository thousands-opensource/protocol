import axios from "axios";

/**
 * Uploads a file to S3 via our API route and returns the URL of the uploaded file
 * @param file The file to upload
 * @returns Promise that resolves to the S3 URL of the uploaded file
 */
export const uploadFileToS3 = async (file: File): Promise<string> => {
    // Create a FormData instance to send the file
    const formData = new FormData();
    formData.append("file", file);

    try {
        // Send the file to our API route
        const response = await axios.post("/api/uploadS3Image", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        // Get the S3 URL from the response
        const data = response.data;
        return data.url;
    } catch (error: any) {
        console.error("Error uploading file:", error);
        throw new Error(
            `Failed to upload file to S3: ${
                error.response?.data?.message || error
            }`
        );
    }
};
