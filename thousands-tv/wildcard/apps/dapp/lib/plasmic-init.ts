import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

let PLASMIC: any = null;

try {
    const projectId = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID;
    const projectToken = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN;

    if (projectId && projectToken) {
        PLASMIC = initPlasmicLoader({
            projects: [
                {
                    id: projectId,
                    token: projectToken
                }
            ],
            // if preview is true, fetches the latest revisions, whether or not they were published on plasmic. otherwise, only render published changes
            preview: process.env.NODE_ENV === 'development'
        });
    } else {
        console.warn('Plasmic environment variables not configured. Set NEXT_PUBLIC_PLASMIC_PROJECT_ID and NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN');
    }
} catch (error) {
    console.warn('Plasmic loader not available. Install @plasmicapp/loader-nextjs to use Plasmic features.');
}

export { PLASMIC };
