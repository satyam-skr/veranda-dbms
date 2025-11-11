import { query } from '../db/pool.js';
import {ApiResponse} from '../utils/ApiResponse.js'
import { createBid } from '../models/bids.sql.js';

const addBid = async (req, res)=>{
    try {
        const {listingId} = req.params;
        // const bidder_id = req.user.user_id
        const bidder_id = '73a41e0c-e6f9-43e8-b2f5-31e0e3a325b4';
        const {bid_amount} = req.body;
        const rows = await query(createBid, [listingId, bidder_id, bid_amount]);

        return res.status(200).json(
            new ApiResponse(200,rows[0], "bid created successfully")
        );

    } catch (error) {
        console.log(`error while creating bid ${error}`);
        return res.status(500).json(
            new ApiResponse(500, null, "error while creating bid")
        )
    }
}

export const bidsController = {
    addBid
}


// bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
//     bidder_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
//     bid_amount NUMERIC(10, 2) NOT NULL CHECK (bid_amount > 0),
//     bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP