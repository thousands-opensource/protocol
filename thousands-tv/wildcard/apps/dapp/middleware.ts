// pages/wildfile/_middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIES_ACCESS_TOKEN_WILDCARD } from "@/utils/accountAPIUtil";

export async function middleware(req: NextRequest) {
    const url = new URL(req.url);
    const incomingPathname = url.pathname; // incoming path from the request

    const wildcardAccessTokenCookie =
        req.cookies.get(COOKIES_ACCESS_TOKEN_WILDCARD)?.value || "";

    const basicAuth = req.headers.get("authorization");
    const user = process.env.PROTECTED_AUTH_USER;
    const password = process.env.PROTECTED_AUTH_PASSWORD;

    //@dev - disabled password protection for playtests
    // ================ Basic Auth (Protected Routes) ============

    // if (basicAuth) {
    //     const authValue = basicAuth.split(" ")[1];
    //     const [authUser, authPwd] = atob(authValue).split(":");

    //     if (authUser !== user || authPwd !== password) {
    //         url.pathname = "/api/auth/protected";
    //         return NextResponse.rewrite(url);
    //     }
    // } else {
    //     url.pathname = "/api/auth/protected";
    //     return NextResponse.rewrite(url);
    // }

    // ================ Validate token ============

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/wildfile",
        "/wildfile/userId/:_id*",
        "/",
        "/login",
        "/signup",
        "/verify",
    ],
};
