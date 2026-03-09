import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", function () {
  // Guard against missing env variable
  if (!process.env.API_URL) {
    console.warn("Cron job skipped: API_URL environment variable is not set");
    return;
  }

  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log("Keep-alive GET request sent successfully");
      } else {
        console.warn("Keep-alive GET request failed with status:", res.statusCode);
      }
    })
    .on("error", (e) => console.error("Cron job request error:", e.message));
});

export default job;

/* CRON JOB EXPLANATION:
    Cron Jobs are scheduled tasks that run periodically at fixed intervals
    We'd want to send 1 GET request for every 14 minutes

    How to define a "Schedule"?

    You define a schedule using a cron expression, which consists of five
    fields representing:

    //! MINUTE, HOUR, DAY OF THE MONTH, MONTH, DAY OF THE WEEK

    * 14 * * * * - Every 14 minutes
    * 0 0 * * 0 - At midnight on every Sunday
    * 30 3 15 * * - At 3:30 AM, on the 15th of every Month
    *  0 0 1 1 0 - At midnight, on January 1st
    * 0 * * * * - Every hour
*/