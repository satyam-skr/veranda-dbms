import { ApiResponse } from '../utils/ApiResponse.js';
import { query, getClient } from '../db/pool.js';
import {createListing, readActiveListings, readListingById, deleteListing, updateListingStatusSold, readBiddersForListing} from '../models/listings.sql.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
//add remove modify get

const addListing = async (req, res) => {
  try {
    const { title, item_description, price, condition} = req.body; 
    // const seller_id = req.user.user_id; // Assuming user ID is available in req.user
    // const seller_id = req.body.seller_id; // Temporary for testing without auth
    const seller_id = '73a41e0c-e6f9-43e8-b2f5-31e0e3a325b4'
    const image_file = req.files['image'] ? req.files['image'][0] : null;
    
    // Fix: Pass the file path, not the entire file object
    const image_url = image_file ? (await uploadOnCloudinary(image_file.path, 'veranda/listings')).url : null;
    
    if(image_file){
      console.log("image is there");
    }
    console.log("image_url", image_url);
    
    const result = await query(createListing, [title, item_description, price, condition, seller_id, image_url]);
    res.status(201).json(
      new ApiResponse(201, result.rows[0], 'Listing created successfully')
    )
  } catch (err) {
    console.error('createListing error:', err);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to create listing')
    );
  }
};


const getActiveListings = async (req, res) => {
  try {
    const result = await query(readActiveListings);
    res.status(200).json({data: result.rows});
  } catch (err) {
    console.error('getActiveListings error:', err);
    res.status(500).json(
      new ApiResponse(500, null, 'Failed to fetch active listings')
    )
  }
};

const getListingById = async (req, res) => {
  try {
    const listing_id = req.params.listing_id;
    if(!listing_id) return res.status(400).json({ error: 'listing_id is required' });
    const result = await query(readListingById, [listing_id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Listing not found' });

    res.status(200).json(new ApiResponse(200, result.rows[0], 'Listing fetched successfully'));
  } catch (err) {
    console.error('listSingle error:', err);
    res.status(500).json(new ApiResponse(500, null, 'Failed to fetch listing'));
  }
};

const removeListing = async (req, res) => { 
  try {
    const listing_id = req.params.listing_id;
    if(!listing_id) return res.status(400).json(
      new ApiResponse(400, null, 'listing_id is required')
    );
    const result = await query(deleteListing, [listing_id]);
    res.status(200).json(new ApiResponse(200, result.rows[0], 'Listing removed successfully'));
  } catch (err) {
    console.error('removeListing error:', err);
    res.status(500).json({ error: 'Failed to remove listing' });
  }
}

const modifyListingStatusSold = async (req,res)=>{
  try {
    const {listingId} = req.params;
    // const sellerId = req.user.user_id;
    // if(sellerId != ){
    //   return res.status(400).json(
    //     new ApiResponse(400, null, "unauthorized")
    //   )
    // }
    const rows = await  query(updateListingStatusSold, [listingId]);  
    return res.status(200).json(
      new ApiResponse(200,rows[0], "status updated to sold")
    )
    
    
  } catch (error) {
    console.log('error while updating listing', error);
    return res.status(500).json(
      new ApiResponse(500, null, "error while updating")
    )
  }
}

const fetchBidders = async (req, res)=>{
  try {
    const {listingId} = req.params;
    const rows = await query(readBiddersForListing, [listingId]);
    return res.status(200).json(
      new ApiResponse(200, rows, "fetched bidders successfully")
    )
  } catch (error) {
    console.log('error while fetching bidders', error);
    res.status(500).json(
      new ApiResponse(500, null, "error while fetching bidders")
    )
  }
}

// listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     -- Foreign key: seller is a user
//     seller_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
//     title VARCHAR(255) NOT NULL,
//     item_description TEXT,
//     price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
//     condition VARCHAR(50),
//     item_status VARCHAR(50) DEFAULT 'active' CHECK (item_status IN ('active', 'sold', 'inactive', 'removed')),
//     -- Foreign key: buyer is optional (null if unsold)
//     buyer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
//     metadata JSONB DEFAULT '{}'::jsonb,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

const listingController = {
  addListing,
  getActiveListings,
  getListingById,
  removeListing,
  modifyListingStatusSold,
  fetchBidders
};

export { listingController };