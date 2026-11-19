import { syncAuctionStatuses } from "../modules/auction/auction.jobs.service";

const AUCTION_SYNC_INTERVAL_MS = 30_000;

export function startAuctionJobs() {
  const runAuctionSync = () => {
    void syncAuctionStatuses().catch((err) => {
      console.log("auction sync failed", err);
    });
  };

  runAuctionSync();
  setInterval(runAuctionSync, AUCTION_SYNC_INTERVAL_MS);
}
