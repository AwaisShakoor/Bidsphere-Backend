import {
  expireOverduePayments,
  retryPendingTransfers,
  sendPaymentReminders,
} from "../modules/payment/payment.jobs.service";

const PAYMENT_JOB_INTERVAL_MS = 300_000;

export function startPaymentJobs() {
  const runPaymentJobs = () => {
    void expireOverduePayments().catch((err) => {
      console.log("payment expiry failed", err);
    });

    void retryPendingTransfers().catch((err) => {
      console.log("payment retry failed", err);
    });

    void sendPaymentReminders().catch((err) => {
      console.log("payment reminders failed", err);
    });
  };

  runPaymentJobs();
  setInterval(runPaymentJobs, PAYMENT_JOB_INTERVAL_MS);
}
