export const createBid = `
    INSERT INTO BIDS (LISTING_ID, BIDDER_ID, BID_AMOUNT) 
    VALUES ($1, $2, $3)
    RETURNING BID_ID, LISTING_ID, BIDDER_ID, BID_AMOUNT;
`

// CREATE TABLE 
// IF NOT EXISTS BIDS (
//     bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//     listing_id UUID NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
//     bidder_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
//     bid_amount NUMERIC(10, 2) NOT NULL CHECK (bid_amount > 0),
//     bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );