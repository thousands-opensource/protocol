import SnagSolutions from "@snagsolutions/sdk";

let cachedSnagSolutionsClient: SnagSolutions | null = null;

export function getSnagSolutionsClient(): SnagSolutions {
    const apiKey = process.env.SNAG_SOLUTIONS_API_KEY;

    if (!apiKey) {
        throw new Error(
            "SNAG_SOLUTIONS_API_KEY environment variable is not configured"
        );
    }

    if (!cachedSnagSolutionsClient) {
        cachedSnagSolutionsClient = new SnagSolutions({
            apiKey,
        });
    }

    return cachedSnagSolutionsClient;
}
