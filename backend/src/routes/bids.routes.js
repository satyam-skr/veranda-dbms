import { Router } from "express";
import { bidsController } from "../controllers/bids.controller.js";

const router = Router();

router.post('/:listingId', bidsController.addBid )

export default router;