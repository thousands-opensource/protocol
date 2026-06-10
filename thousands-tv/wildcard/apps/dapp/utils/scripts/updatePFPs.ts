import dotenv from 'dotenv';
import connectToDb from "@/db/connectToDb";
import { updateOneUserDB } from "@repo/schemas";
import { IUser, AccountProvider } from "@repo/interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

import { usersModel } from "@repo/schemas";

interface MigrationStats {
    totalUsers: number;
    usersProcessed: number;
    usersUpdated: number;
    imagesUploaded: number;
    errors: number;
    skipped: number;
    failedDownloads: string[];
}

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

export function isImageFromOurS3Bucket(imageUrl: string): boolean {
    if (!imageUrl || !process.env.AWS_S3_BUCKET) {
        return false;
    }

    const bucketName = process.env.AWS_S3_BUCKET!;
    const region = process.env.AWS_REGION || 'us-east-1';

    const s3UrlPattern1 = `https://${bucketName}.s3.${region}.amazonaws.com/`;
    const s3UrlPattern2 = `https://s3.${region}.amazonaws.com/${bucketName}/`;

    return imageUrl.startsWith(s3UrlPattern1) || imageUrl.startsWith(s3UrlPattern2);
}

/**
 * Uploads an image from a URL to S3 bucket with a unique filename
 * @param imageUrl - The source image URL to download and upload
 * @param userAddress - The user's wallet address (used for prefixing)
 * @param providerType - The account provider type (defaults to 'wallet')
 * @returns The S3 URL of the uploaded image or null if failed
 */
export async function uploadPfpImageToS3(
    imageUrl: string,
    userAddress: string,
    providerType: string = 'wallet'
): Promise<string | null> {
    try {
        if (!imageUrl || imageUrl === '' || imageUrl === '0x0000000000000000000000000000000000000000') {
            return null;
        }

        console.log(`Starting S3 upload for PFP image: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error(`Failed to fetch image from ${imageUrl}: ${response.statusText}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
            console.error(`Image too large: ${buffer.length} bytes`);
            return null;
        }

        let fileExtension = 'jpg';
        const contentType = response.headers.get('content-type');
        if (contentType) {
            if (contentType.includes('png')) fileExtension = 'png';
            else if (contentType.includes('gif')) fileExtension = 'gif';
            else if (contentType.includes('webp')) fileExtension = 'webp';
            else if (contentType.includes('svg')) fileExtension = 'svg';
        } else {
            const urlExtension = imageUrl.split('.').pop()?.toLowerCase();
            if (urlExtension && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(urlExtension)) {
                fileExtension = urlExtension === 'jpeg' ? 'jpg' : urlExtension;
            }
        }

        const cleanUserAddress = userAddress.replace(/[^a-zA-Z0-9]/g, '');

        const filename = `pfp/${cleanUserAddress}_${providerType}.${fileExtension}`;

        const uploadParams = {
            Bucket: process.env.AWS_S3_BUCKET!,
            Key: filename,
            Body: buffer,
            ContentType: contentType || 'image/jpeg',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
        console.log(`Successfully uploaded PFP image to S3: ${s3Url}`);
        return s3Url;

    } catch (error) {
        console.error('Error uploading PFP image to S3:', error);
        return null;
    }
}

function isThousandsLink(imageUrl: string): boolean {
    if (!imageUrl) return false;
    return imageUrl.includes('thousands.gg') || imageUrl.includes('wildcard.gg');
}

function generateDicebearUrl(userAddress: string): string {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${userAddress}`;
}

async function processUserImages(user: IUser, stats: MigrationStats): Promise<void> {
    try {
        console.log(`Processing user: ${user._id}`);
        stats.usersProcessed++;

        const userAddress = user.walletProvider?.address || user._id?.toString() || 'unknown';
        const updates: any = {};
        let hasUpdates = false;

        const processedImages = new Map<string, string>();
        const processImage = async (imageUrl: string, providerType: string): Promise<string | null> => {
            if (!imageUrl || isImageFromOurS3Bucket(imageUrl) || isThousandsLink(imageUrl)) {
                return null;
            }

            if (processedImages.has(imageUrl)) {
                console.log(`Using cached S3 URL for duplicate image: ${imageUrl}`);
                return processedImages.get(imageUrl)!;
            }

            try {
                const s3Url = await uploadPfpImageToS3(imageUrl, userAddress, providerType);
                if (s3Url) {
                    processedImages.set(imageUrl, s3Url);
                    stats.imagesUploaded++;
                    console.log(`Uploaded ${providerType} image: ${imageUrl} -> ${s3Url}`);
                    return s3Url;
                } else {
                    console.log(`Failed to upload ${providerType} image (not downloadable): ${imageUrl}`);
                    stats.failedDownloads.push(`${userAddress}:${providerType}:${imageUrl}`);

                    if (providerType === 'wallet') {
                        const dicebearUrl = generateDicebearUrl(userAddress);
                        console.log(`Using dicebear fallback for wallet PFP: ${dicebearUrl}`);
                        return dicebearUrl;
                    }

                    return null;
                }
            } catch (error) {
                console.error(`Error uploading ${providerType} image:`, error);
                stats.failedDownloads.push(`${userAddress}:${providerType}:${imageUrl}`);

                if (providerType === 'wallet') {
                    const dicebearUrl = generateDicebearUrl(userAddress);
                    console.log(`Using dicebear fallback for wallet PFP after error: ${dicebearUrl}`);
                    return dicebearUrl;
                }

                return null;
            }
        };

        if (user.walletProvider?.pfp?.imageUrl) {
            const originalPfpUrl = user.walletProvider.pfp.imageUrl;
            const newPfpUrl = await processImage(originalPfpUrl, 'wallet');
            if (newPfpUrl) {
                updates['walletProvider.pfp.imageUrl'] = newPfpUrl;
                hasUpdates = true;
            }
        }

        const providers = [
            { key: 'discordProvider', type: 'discord' },
            { key: 'twitchProvider', type: 'twitch' },
            { key: 'googleProvider', type: 'google' },
            { key: 'twitterProvider', type: 'twitter' },
            { key: 'beamableProvider', type: 'beamable' }
        ];

        for (const provider of providers) {
            const providerData = (user as any)[provider.key] as AccountProvider | undefined;
            if (providerData?.image) {
                const originalImageUrl = providerData.image;
                const newImageUrl = await processImage(originalImageUrl, provider.type);
                if (newImageUrl) {
                    updates[`${provider.key}.image`] = newImageUrl;
                    hasUpdates = true;
                }
            }
        }

        if (hasUpdates) {
            const updateQuery = { $set: updates };
            const result = await updateOneUserDB({ _id: user._id }, updateQuery);

            if (result) {
                stats.usersUpdated++;
                console.log(`Updated user ${user._id} with ${Object.keys(updates).length} image changes`);
            } else {
                console.error(`Failed to update user ${user._id} in database`);
                stats.errors++;
            }
        } else {
            console.log(`No images to migrate for user ${user._id}`);
            stats.skipped++;
        }

    } catch (error) {
        console.error(`Error processing user ${user._id}:`, error);
        stats.errors++;
    }
}

async function migrateAllImagesToS3(): Promise<void> {
    const stats: MigrationStats = {
        totalUsers: 0,
        usersProcessed: 0,
        usersUpdated: 0,
        imagesUploaded: 0,
        errors: 0,
        skipped: 0,
        failedDownloads: []
    };

    try {
        await connectToDb();
        console.log('Connected to MongoDB');

        const UsersModel = usersModel;

        const queryFilter = { 'walletProvider.address': '0x6Fb65d468c4531ae273AB0470CCf318dcC178423' };
        stats.totalUsers = await UsersModel.countDocuments(queryFilter);
        console.log(`Found ${stats.totalUsers} total users to process`);

        const batchSize = 20;
        let skip = 0;

        while (skip < stats.totalUsers) {
            console.log(`Processing batch: ${skip + 1}-${Math.min(skip + batchSize, stats.totalUsers)} of ${stats.totalUsers}`);

            const users = await UsersModel.find(queryFilter)
                .skip(skip)
                .limit(batchSize)
                .lean()
                .exec() as IUser[];

            for (const user of users) {
                console.log(`Processing user ${user._id}...`);
                await processUserImages(user, stats);
                await new Promise(resolve => setTimeout(resolve, 50));
            }

            skip += batchSize;

            console.log(`Batch Progress: ${stats.usersProcessed}/${stats.totalUsers} users processed`);
            console.log(`   Updated: ${stats.usersUpdated}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
            console.log(`   Images uploaded: ${stats.imagesUploaded}, Failed downloads: ${stats.failedDownloads.length}`);

            await new Promise(resolve => setTimeout(resolve, 100));
        }

    } catch (error) {
        console.error('Fatal error during migration:', error);
        stats.errors++;
    }

    console.log('Migration Complete!');
    console.log('='.repeat(60));
    console.log(`Final Statistics:`);
    console.log(`   Total users: ${stats.totalUsers}`);
    console.log(`   Users processed: ${stats.usersProcessed}`);
    console.log(`   Users updated: ${stats.usersUpdated}`);
    console.log(`   Users skipped: ${stats.skipped}`);
    console.log(`   Images uploaded: ${stats.imagesUploaded}`);
    console.log(`   Errors: ${stats.errors}`);
    console.log(`   Failed downloads: ${stats.failedDownloads.length}`);
    console.log(`   Success rate: ${((stats.usersProcessed - stats.errors) / Math.max(stats.usersProcessed, 1) * 100).toFixed(2)}%`);

    if (stats.failedDownloads.length > 0) {
        console.log('Failed Downloads (user:provider:url):');
        stats.failedDownloads.forEach((failure, index) => {
            console.log(`   ${index + 1}. ${failure}`);
        });

        const fs = await import('fs');
        const failedDownloadsPath = 'migration_failed_downloads.txt';
        fs.writeFileSync(failedDownloadsPath, stats.failedDownloads.join('\n'));
        console.log(`Failed downloads saved to: ${failedDownloadsPath}`);
    }
}

function validateEnvironment(): boolean {
    const required = ['AWS_REGION', 'AWS_S3_BUCKET', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
    const missing = required.filter(env => !process.env[env]);

    if (missing.length > 0) {
        console.error('Missing required environment variables:', missing.join(', '));
        return false;
    }
    return true;
}

if (require.main === module) {
    if (!validateEnvironment()) {
        process.exit(1);
    }

    migrateAllImagesToS3()
        .then(() => {
            console.log('Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

export default migrateAllImagesToS3;