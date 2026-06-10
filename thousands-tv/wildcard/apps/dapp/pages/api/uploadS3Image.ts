export const config = {
    api: {
        bodyParser: false, // Disables default body parser so formidable can handle the upload
    },
};

import { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";
import { authorize } from "./middleware/authorization";
import { UserRole } from "@repo/interfaces";
import { generateGUID } from "@/utils/beamableUtil";

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const form = formidable();
        const [fields, files] = await form.parse(req);
        const file = files.file?.[0];
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileStream = fs.createReadStream(file.filepath);
        const fileExtension = file.originalFilename?.split(".").pop() || "";

        const guid = generateGUID();

        const key = `${guid}.${fileExtension}`;

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: key,
            Body: fileStream,
            ContentType: file.mimetype || "application/octet-stream",
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        // Get the URL for the uploaded file
        const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

        // Clean up the temporary file
        fs.unlinkSync(file.filepath);

        return res.status(200).json({ url });
    } catch (error) {
        console.error("Error uploading file:", error);
        return res
            .status(500)
            .json({ message: `Error uploading file: ${error}` });
    }
};

export default authorize(handler, [UserRole.ORGANIZER, UserRole.ADMIN]);
