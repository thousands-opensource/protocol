import { UserRole } from "@repo/interfaces";

export const DEFAULT_SERVER_CODE_PLACEHOLDER = ":serverCode";

export enum AccessRules {
    REQUIRE_DISPLAY_NAME = "requireDisplayName",
    REQUIRE_EMAIL = "requireEmail",
    REQUIRE_AT_LEAST_ONE_SOCIAL = "requireAtLeastOneSocial",
    REQUIRE_LINKED_WALLET = "requireLinkedWallet",
    REQUIRE_TWITTER_LINKED = "requireTwitterLinked",
}

export interface RouteConfig {
    url: string;
    allowedRoles: UserRole[];
    accessRules: AccessRules[];
}

type WildfileRoutes = {
    HOME: RouteConfig;
    LOGIN: RouteConfig;
    COMPETITORLOGIN: RouteConfig;
    SIGN_UP_CONFIRMATION: RouteConfig;
    UNAUTHORIZED: RouteConfig;
    VERIFY: RouteConfig;
    SERVER: {
        HOMEPAGE: RouteConfig;
        WILDFILE: {
            BASE: RouteConfig;
            USER_ID: RouteConfig;
            PROFILE: {
                BASE: RouteConfig;
                GENERAL: RouteConfig;
                CREDIT_PURCHASES: RouteConfig;
                STATS: RouteConfig;
                EMAIL_PREFERENCE: RouteConfig;
                PASSWORD: RouteConfig;
                CONNECTED_ACCOUNTS: RouteConfig;
                WEB3_WALLET: RouteConfig;
            };
            HELP_AND_SUPPORT: {
                BASE: RouteConfig;
            };
            EVENT: {
                BASE: RouteConfig;
                CREATE: RouteConfig;
                BOOKINGS: RouteConfig;
            };
        };
        NOTIFICATIONS: {
            BASE: RouteConfig;
        };
        REALTIMESTREAM: {
            BASE: RouteConfig;
        };
        SERIES_DASHBOARD: {
            BASE: RouteConfig;
            SERIES: {
                BASE: RouteConfig;
                CREATE: RouteConfig;
            };
        };
        IDENTITY_DASHBOARD: {
            BASE: RouteConfig;
            IDENTITY: {
                BASE: RouteConfig;
                CREATE: RouteConfig;
            };
        };
        MANAGE_PREDICTIONS_DASHBOARD: {
            BASE: RouteConfig;
            PREDICTIONS: {
                BASE: RouteConfig;
                CREATE: RouteConfig;
            };
        };
        MANAGE_TOURNAMENTS_DASHBOARD: {
            BASE: RouteConfig;
            CREATE: RouteConfig;
            UPDATE: RouteConfig;
            TOURNAMENT_PAYOUT_SCHEDULES: RouteConfig;
            CREATE_TOURNAMENT_PAYOUT_SCHEDULE: RouteConfig;
            UPDATE_TOURNAMENT_PAYOUT_SCHEDULE: RouteConfig;
        };
        STREAMS: {
            BASE: RouteConfig;
        };
        STREAM: {
            BASE: RouteConfig;
        };
        EVENT_DASHBOARD: {
            BASE: RouteConfig;
            FRANCHISES: RouteConfig;
            EVENT: {
                BASE: RouteConfig;
                CREATE: RouteConfig;
                BOOKINGS: RouteConfig;
                EDIT: RouteConfig;
            };
            LIVE: {
                EVENT: {
                    BASE: RouteConfig;
                };
            };
        };
        BASE: RouteConfig;
        EVENTS: {
            BASE: RouteConfig;
            EVENT_ID: RouteConfig;
        };
        LIMITEDTIMECREDITS: {
            BASE: RouteConfig;
        };
        USERS: {
            CREDITADJUSTMENTS: {
                BASE: RouteConfig;
            };
        };
        EXTERNAL_STREAMS: {
            BASE: RouteConfig;
        };
        RALLY_PREDICTION_SETTLEMENT: {
            BASE: RouteConfig;
        };
        USERDASHBOARD: {
            BASE: RouteConfig;
        };
        STREAMERDASHBOARD: {
            BASE: RouteConfig;
        };
        FORECASTS: {
            BASE: RouteConfig;
            DETAIL: RouteConfig;
            LEADERBOARD: RouteConfig;
        };
        FRANCHISES: {
            BASE: RouteConfig;
            DETAIL: RouteConfig;
        };
        METRICS: {
            BASE: RouteConfig;
        };
        PROS: {
            BASE: RouteConfig;
        };
        COMPETITORS: {
            BASE: RouteConfig;
        };
        SPONSOREVENTS: {
            BASE: RouteConfig;
            DETAIL: RouteConfig;
            MYSPONSORSHIPS: RouteConfig;
        };
    };
};

/**
 * Wildfile routes
 * @type {WildfileRoutes}
 * @dev - This is the main route configuration for the Wildfile app. We use this to define the routes and their access rules.
 * The access rules are used to determine if a user has access to a route based on their user profile. All page routes are to be defined here.
 */
// TODO: Update naming after V1
export const WILDFILE_ROUTES: WildfileRoutes = {
    HOME: { url: "/", allowedRoles: [], accessRules: [] },
    LOGIN: { url: "/login", allowedRoles: [], accessRules: [] },
    COMPETITORLOGIN: { url: "/competitorlogin", allowedRoles: [], accessRules: [] },
    SIGN_UP_CONFIRMATION: {
        url: "/sign-up-confirmation",
        allowedRoles: [],
        accessRules: [],
    },
    UNAUTHORIZED: {
        url: "/unauthorized",
        allowedRoles: [],
        accessRules: [],
    },
    VERIFY: {
        url: "/verify",
        allowedRoles: [UserRole.SPECTATOR],
        accessRules: [],
    },
    SERVER: {
        BASE: {
            url: "/:serverCode",
            allowedRoles: [UserRole.SPECTATOR],
            accessRules: [AccessRules.REQUIRE_DISPLAY_NAME],
        },
        HOMEPAGE: { 
            url: "/:serverCode/home", 
            allowedRoles: [UserRole.SPECTATOR], 
            accessRules: [AccessRules.REQUIRE_DISPLAY_NAME] },
        EVENTS: {
            BASE: {
                url: "/:serverCode/events",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [AccessRules.REQUIRE_DISPLAY_NAME],
            },
            EVENT_ID: {
                url: "/:serverCode/events/:id",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [AccessRules.REQUIRE_DISPLAY_NAME],
            },
        },
        WILDFILE: {
            BASE: {
                url: "/:serverCode/wildfile",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            USER_ID: {
                url: "/:serverCode/wildfile/userId/:id",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            PROFILE: {
                BASE: {
                    url: "/:serverCode/wildfile/profile",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                GENERAL: {
                    url: "/:serverCode/wildfile/profile/general",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                CREDIT_PURCHASES: {
                    url: "/:serverCode/wildfile/profile/credit-purchases",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                STATS: {
                    url: "/:serverCode/wildfile/profile/stats",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                EMAIL_PREFERENCE: {
                    url: "/:serverCode/wildfile/profile/email-preference",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                PASSWORD: {
                    url: "/:serverCode/wildfile/profile/password",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                CONNECTED_ACCOUNTS: {
                    url: "/:serverCode/wildfile/profile/connected-accounts",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
                WEB3_WALLET: {
                    url: "/:serverCode/wildfile/profile/web3-wallet",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
            },
            HELP_AND_SUPPORT: {
                BASE: {
                    url: "/:serverCode/wildfile/help-and-support",
                    allowedRoles: [UserRole.SPECTATOR],
                    accessRules: [],
                },
            },
            EVENT: {
                BASE: {
                    url: "/:serverCode/wildfile/event",
                    allowedRoles: [UserRole.ORGANIZER],
                    accessRules: [],
                },
                CREATE: {
                    url: "/:serverCode/wildfile/event/create",
                    allowedRoles: [UserRole.ORGANIZER],
                    accessRules: [],
                },
                BOOKINGS: {
                    url: "/:serverCode/wildfile/event/bookings",
                    allowedRoles: [UserRole.ORGANIZER],
                    accessRules: [],
                },
            },
        },
        NOTIFICATIONS: {
            BASE: {
                url: "/:serverCode/notifications",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        REALTIMESTREAM: {
            BASE: {
                url: "/:serverCode/realtimestream/:streamId",
                allowedRoles: [
                    UserRole.ADMIN,
                    UserRole.ORGANIZER,
                    UserRole.BROADCASTER,
                    UserRole.GUESTBROADCASTER,
                ],
                accessRules: [AccessRules.REQUIRE_DISPLAY_NAME],
            },
        },
        SERIES_DASHBOARD: {
            BASE: {
                url: "/:serverCode/series",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            SERIES: {
                BASE: {
                    url: "/:serverCode/series/:serieId",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                CREATE: {
                    url: "/:serverCode/series/create",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
            },
        },
        IDENTITY_DASHBOARD: {
            BASE: {
                url: "/:serverCode/identities",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            IDENTITY: {
                BASE: {
                    url: "/:serverCode/identities/:identityId",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                CREATE: {
                    url: "/:serverCode/identities/create",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
            },
        },
        MANAGE_PREDICTIONS_DASHBOARD: {
            BASE: {
                url: "/:serverCode/managepredictions",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            PREDICTIONS: {
                BASE: {
                    url: "/:serverCode/managepredictions/:rallyPredictionId",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                CREATE: {
                    url: "/:serverCode/managepredictions/create",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
            },
        },
        MANAGE_TOURNAMENTS_DASHBOARD: {
            BASE: {
                url: "/:serverCode/managetournaments",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            CREATE: {
                url: "/:serverCode/managetournaments/create",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            UPDATE: {
                url: "/:serverCode/managetournaments/update",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            TOURNAMENT_PAYOUT_SCHEDULES: {
                url: "/:serverCode/managetournaments/tournamentPayoutSchedules",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            CREATE_TOURNAMENT_PAYOUT_SCHEDULE: {
                url: "/:serverCode/managetournaments/createTournamentPayoutSchedule",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            UPDATE_TOURNAMENT_PAYOUT_SCHEDULE: {
                url: "/:serverCode/managetournaments/updateTournamentPayoutSchedule",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
        },
        STREAMS: {
            BASE: {
                url: "/:serverCode/streams",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        STREAM: {
            BASE: {
                url: "/:serverCode/stream/:streamId",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [
                    AccessRules.REQUIRE_DISPLAY_NAME,
                    AccessRules.REQUIRE_LINKED_WALLET,
                ],
            },
        },
        EVENT_DASHBOARD: {
            BASE: {
                url: "/:serverCode/eventdashboard",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            FRANCHISES: {
                url: "/:serverCode/eventdashboard/franchises",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
            EVENT: {
                BASE: {
                    url: "/:serverCode/eventdashboard/event/:eventId",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                CREATE: {
                    url: "/:serverCode/eventdashboard/event/create",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                BOOKINGS: {
                    url: "/:serverCode/eventdashboard/event/bookings",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
                EDIT: {
                    url: "/:serverCode/eventdashboard/event/:eventId/edit",
                    allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                    accessRules: [],
                },
            },
            LIVE: {
                EVENT: {
                    BASE: {
                        url: "/:serverCode/live/event/:eventId",
                        allowedRoles: [UserRole.SPECTATOR],
                        accessRules: [
                            AccessRules.REQUIRE_DISPLAY_NAME,
                            AccessRules.REQUIRE_EMAIL,
                        ],
                    },
                },
            },
        },
        LIMITEDTIMECREDITS: {
            BASE: {
                url: "/:serverCode/limitedtimecredits",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        USERS: {
            CREDITADJUSTMENTS: {
                BASE: {
                    url: "/:serverCode/users/creditadjustments",
                    allowedRoles: [UserRole.ADMIN],
                    accessRules: [],
                },
            },
        },
        EXTERNAL_STREAMS: {
            BASE: {
                url: "/:serverCode/externalStreams",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
        },
        RALLY_PREDICTION_SETTLEMENT: {
            BASE: {
                url: "/:serverCode/rally-prediction-settlement",
                allowedRoles: [UserRole.ADMIN, UserRole.ORGANIZER],
                accessRules: [],
            },
        },
        USERDASHBOARD: {
            BASE: {
                url: "/:serverCode/userdashboard",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        STREAMERDASHBOARD: {
            BASE: {
                url: "/:serverCode/streamerdashboard",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        FORECASTS: {
            BASE: {
                url: "/:serverCode/forecasts",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            DETAIL: {
                url: "/:serverCode/forecasts/:predictionId",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            LEADERBOARD: {
                url: "/:serverCode/forecasts/?tab=leaderboard",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        FRANCHISES: {
            BASE: {
                url: "/:serverCode/franchises",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            DETAIL: {
                url: "/:serverCode/franchises/:userId",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        METRICS: {
            BASE: {
                url: "/:serverCode/metrics",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        PROS: {
            BASE: {
                url: "/:serverCode/pros",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
        COMPETITORS: {
            BASE: {
                url: "/:serverCode/competitor",
                allowedRoles: [UserRole.SPECTATOR, UserRole.COMPETITOR],
                accessRules: [],
            },
        },
        SPONSOREVENTS: {
            BASE: {
                url: "/:serverCode/sponsorevents",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            DETAIL: {
                url: "/:serverCode/sponsorevents/:sponsoredEventId",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
            MYSPONSORSHIPS: {
                url: "/:serverCode/sponsorevents/mysponsorships",
                allowedRoles: [UserRole.SPECTATOR],
                accessRules: [],
            },
        },
    },
};

// Auth API
export const API_AUTH_ROUTES = {
    AUTH: {
        NEXTAUTH: "/api/auth/[...nextauth]",
        CHECK_MFA_STEP_COMPLETED: "/api/auth/check-mfa-step-completed",
        CREATE_TOTP: "/api/auth/create-totp",
        DISCONNECT_TOTP: "/api/auth/disconnect-totp",
        LOGIN_BEAMABLE: "/api/auth/loginBeamable",
        LOGOUT: "/api/auth/logout",
        UPDATE_MFA_STEP_COMPLETED: "/api/auth/update-mfa-step-completed",
        UPDATE_PRIMARY_ACCOUNT_PROVIDER:
            "/api/auth/update-primary-account-provider",
        VALIDATE_TOTP: "/api/auth/validate-totp",
        VERIFY_TOTP: "/api/auth/verify-totp",
        WILDCARD: {
            LINK_WALLET: "/api/auth/wildcard/link-wallet",
            TOKEN: "/api/auth/wildcard/token",
            VALIDATE_TOKEN: "/api/auth/wildcard/validate-token",
        },
    },
};

// Beamable API
export const API_BEAMABLE_ROUTES = {
    APPLY_CONTENT: "/api/beamable/apply-content",
    CALENDAR: "/api/beamable/user/calendar",
    CREATE_STATS: "/api/beamable/user/create-stats",
    EVENT: {
        DELETE: "/api/beamable/user/event/delete",
        GET: "/api/beamable/user/event/get",
    },
    EVENT_PLAYERS: {
        GET: "/api/beamable/user/event-players/get",
        SCORE: "/api/beamable/user/event-players/score",
    },
    FETCH_ACCOUNT: "/api/beamable/user/fetch-account",
    FETCH_USER: "/api/beamable/user/fetch-user",
    FORGET_USER: "/api/beamable/user/forget-user",
    GET_STATS: "/api/beamable/user/get-stats",
    PASSWORD_RESET: "/api/beamable/user/password-reset",
    PASSWORD_UPDATE: "/api/beamable/user/password-update",
    PERSONAL_INFORMATION: "/api/beamable/user/personal-information",
    REGISTER: "/api/beamable/user/register",
    ROLES: {
        APPLY_ROLE: "/api/beamable/user/roles/apply-role",
        GET: "/api/beamable/user/roles/get",
    },
    UPDATE_ACCOUNTS: "/api/beamable/user/update-accounts",
};
