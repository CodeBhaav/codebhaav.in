/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as email from "../email.js";
import type * as emails_AccountWelcomeEmail from "../emails/AccountWelcomeEmail.js";
import type * as emails_ApplicationAcceptedEmail from "../emails/ApplicationAcceptedEmail.js";
import type * as emails_ApplicationRejectedEmail from "../emails/ApplicationRejectedEmail.js";
import type * as emails_FoundingMemberEmail from "../emails/FoundingMemberEmail.js";
import type * as emails_Layout from "../emails/Layout.js";
import type * as emails_TestEmail from "../emails/TestEmail.js";
import type * as emails_WaitlistEmail from "../emails/WaitlistEmail.js";
import type * as foundingMember from "../foundingMember.js";
import type * as http from "../http.js";
import type * as members from "../members.js";
import type * as projectIdeas from "../projectIdeas.js";
import type * as projects from "../projects.js";
import type * as resendConfig from "../resendConfig.js";
import type * as resendResources from "../resendResources.js";
import type * as userProfile from "../userProfile.js";
import type * as waitlist from "../waitlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  email: typeof email;
  "emails/AccountWelcomeEmail": typeof emails_AccountWelcomeEmail;
  "emails/ApplicationAcceptedEmail": typeof emails_ApplicationAcceptedEmail;
  "emails/ApplicationRejectedEmail": typeof emails_ApplicationRejectedEmail;
  "emails/FoundingMemberEmail": typeof emails_FoundingMemberEmail;
  "emails/Layout": typeof emails_Layout;
  "emails/TestEmail": typeof emails_TestEmail;
  "emails/WaitlistEmail": typeof emails_WaitlistEmail;
  foundingMember: typeof foundingMember;
  http: typeof http;
  members: typeof members;
  projectIdeas: typeof projectIdeas;
  projects: typeof projects;
  resendConfig: typeof resendConfig;
  resendResources: typeof resendResources;
  userProfile: typeof userProfile;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
