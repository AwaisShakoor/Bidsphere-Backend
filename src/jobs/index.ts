import { startAuctionJobs } from "./auction.jobs";
import { startPaymentJobs } from "./payment.jobs";

export function startJobs() {
  startAuctionJobs();
  startPaymentJobs();
}
