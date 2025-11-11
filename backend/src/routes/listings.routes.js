import { Router } from "express";
import {listingController} from "../controllers/listings.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.get("/", listingController.getActiveListings);
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }]), listingController.addListing);
router.get('/:listing_id', listingController.getListingById);
router.delete('/:listing_id', listingController.removeListing);
router.patch('/sell/:listingId', listingController.modifyListingStatusSold)
router.get('/bidders/:listingId', listingController.fetchBidders);

export default router;