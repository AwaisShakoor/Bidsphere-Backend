import {
  expireOverduePayments,
} from "../modules/payment/payment.service";

const PAYMENT_JOB_INTERVAL_MS = 300_000;

export function startPaymentJobs() {
  const runPaymentJobs = () => {
    void expireOverduePayments().catch((err) => {
      console.log("payment expiry failed", err);
    });
  };

  runPaymentJobs();
  setInterval(runPaymentJobs, PAYMENT_JOB_INTERVAL_MS);
}
