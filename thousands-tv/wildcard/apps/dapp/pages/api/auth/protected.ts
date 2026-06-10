import { NextApiRequest, NextApiResponse } from "next";

/**
 * Protected route that requires Basic Auth.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Secure Area"');
    res.status(401).end(
        "Authentication is required. Please get in contact with Community Admin for assistance."
    );
}
