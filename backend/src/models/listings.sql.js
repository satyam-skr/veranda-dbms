export const createListing = `
    INSERT INTO listings (title, item_description, price, condition, seller_id, image_url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING listing_id, title, item_description, price, condition, item_status, image_url, seller_id, created_at;
`;

export const readActiveListings = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, image_url, metadata, created_at, updated_at
    FROM listings
    WHERE item_status = 'active'
    ORDER BY created_at DESC;
`;

export const readListingById = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, image_url, metadata, created_at, updated_at
    FROM listings
    WHERE listing_id = $1;
`;


export const deleteListing = `
    UPDATE listings
    SET item_status = 'removed', updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = $1
    RETURNING listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, image_url, metadata, created_at, updated_at;
`;

export const updateListingStatusSold = `
    UPDATE listings
    SET item_status = 'sold', updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = $1
    RETURNING listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, image_url, metadata, created_at, updated_at;
`;

export const updateListingStatusActive = `
    UPDATE listings
    SET item_status = 'active', updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = $1
    RETURNING listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, image_url, metadata, created_at, updated_at;
`;

export const readBiddersForListing = `
  SELECT 
    b.bid_id,
    b.bid_amount,
    b.bid_time,
    u.user_id AS bidder_id,
    u.full_name AS bidder_name,
    u.email AS bidder_email
  FROM bids b
  JOIN users u ON b.bidder_id = u.user_id
  WHERE b.listing_id = $1
  ORDER BY b.bid_time DESC;
`;
/*
export const purchaseListing = `
    UPDATE listings
    SET item_status = 'sold', buyer_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = $2 AND item_status = 'active'
    RETURNING listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at;
`
export const updateListingMetadata = `
    UPDATE listings
    SET metadata = metadata || $1::jsonb, updated_at = CURRENT_TIMESTAMP
    WHERE listing_id = $2
    RETURNING listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at;
`;

export const searchListingsByTitle = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at
    FROM listings
    WHERE title ILIKE '%' || $1 || '%' AND item_status = 'active'
    ORDER BY created_at DESC;
`;

export const filterListingsByPriceRange = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at
    FROM listings
    WHERE price BETWEEN $1 AND $2 AND item_status = 'active'
    ORDER BY created_at DESC;
`;

export const sortListingsByPrice = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at
    FROM listings
    WHERE item_status = 'active'
    ORDER BY price ASC;
`;

export const sortListingsByDate = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at
    FROM listings
    WHERE item_status = 'active'
    ORDER BY created_at DESC;
`;

export const getListingsBySeller = `
    SELECT listing_id, title, item_description, price, condition, item_status, seller_id, buyer_id, metadata, created_at, updated_at
    FROM listings
    WHERE seller_id = $1
    ORDER BY created_at DESC;
`;
*/

//     listing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

//     title VARCHAR(255) NOT NULL,
//     item_description TEXT,
//     price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
//     condition VARCHAR(50),
//     seller_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

//     item_status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive', 'removed')),

//     buyer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
//     metadata JSONB DEFAULT '{}'::jsonb,
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP