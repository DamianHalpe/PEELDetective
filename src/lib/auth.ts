import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "./db"
import * as schema from "./schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Log password reset URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(`\n${"=".repeat(60)}\nPASSWORD RESET REQUEST\nUser: ${user.email}\nReset URL: ${url}\n${"=".repeat(60)}\n`)
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Log verification URL to terminal (no email integration yet)
      // eslint-disable-next-line no-console
      console.log(`\n${"=".repeat(60)}\nEMAIL VERIFICATION\nUser: ${user.email}\nVerification URL: ${url}\n${"=".repeat(60)}\n`)
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "student",
      },
      schoolId: {
        type: "string",
        required: false,
      },
      points: {
        type: "number",
        defaultValue: 0,
      },
      nickname: {
        type: "string",
        required: false,
        input: true,
      },
      banned: {
        type: "boolean",
        defaultValue: false,
      },
      subscribed: {
        type: "boolean",
        defaultValue: false,
      },
      subscribedAt: {
        type: "string",
        required: false,
      },
      subscriptionPeriodEnd: {
        type: "string",
        required: false,
      },
      themePreference: {
        type: "string",
        required: false,
      },
      customTheme: {
        type: "string",
        required: false,
      },
      leaderboardEnabled: {
        type: "boolean",
        defaultValue: true,
      },
    },
  },
})
