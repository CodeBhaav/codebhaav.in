import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Daily activity digest  09:00 IST = 03:30 UTC. Groups every unread
// notification from the last 24h into one email per opted-in recipient.
crons.cron(
	"daily notification digest",
	"30 3 * * *",
	internal.email.sendDailyNotificationDigest,
);

export default crons;
