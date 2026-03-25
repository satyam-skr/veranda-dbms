// Mock database
let users = [
  {
    id: "1",
    email: "user@example.com",
    name: "Demo User",
    phone: "+1234567890",
    createdAt: new Date().toISOString()
  }
]

let items = [
  {
    id: "1",
    sellerId: "1",
    sellerName: "John Seller",
    sellerEmail: "seller@example.com",
    title: "Vintage Study Desk",
    description:
      "Beautiful wooden study desk in excellent condition. Perfect for hostel room.",
    imageUrl:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    startingPrice: 50,
    currentHighestBid: 75,
    status: "active",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    sellerId: "1",
    sellerName: "John Seller",
    sellerEmail: "seller@example.com",
    title: "Mini Refrigerator",
    description:
      "Compact fridge, 1 year old. Great for storing snacks and drinks.",
    imageUrl:
      "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800",
    startingPrice: 80,
    currentHighestBid: 100,
    status: "active",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  }
]

let bids = [
  {
    id: "1",
    itemId: "1",
    bidderId: "2",
    bidderName: "Jane Bidder",
    bidderEmail: "bidder@example.com",
    bidderPhone: "+0987654321",
    amount: 75,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "2",
    itemId: "2",
    bidderId: "2",
    bidderName: "Jane Bidder",
    bidderEmail: "bidder@example.com",
    bidderPhone: "+0987654321",
    amount: 100,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  }
]

// Simulate API delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Auth API
export const authApi = {
  login: async (email, password) => {
    await delay(500)
    const user = users.find(u => u.email === email)
    if (!user) {
      throw new Error("Invalid credentials")
    }
    return user
  },

  signup: async (email, password, name, phone) => {
    await delay(500)
    const existingUser = users.find(u => u.email === email)
    if (existingUser) {
      throw new Error("User already exists")
    }
    const newUser = {
      id: String(users.length + 1),
      email,
      name,
      phone,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    return newUser
  }
}

// Items API
export const itemsApi = {
  getAll: async () => {
    await delay(300)
    return items.filter(item => item.status === "active")
  },

  getByUserId: async userId => {
    await delay(300)
    return items.filter(item => item.sellerId === userId)
  },

  getById: async id => {
    await delay(300)
    return items.find(item => item.id === id)
  },

  create: async itemData => {
    await delay(500)
    const newItem = {
      ...itemData,
      id: String(items.length + 1),
      currentHighestBid: itemData.startingPrice,
      createdAt: new Date().toISOString()
    }
    items.push(newItem)
    return newItem
  },

  update: async (id, updates) => {
    await delay(500)
    const index = items.findIndex(item => item.id === id)
    if (index === -1) {
      throw new Error("Item not found")
    }
    items[index] = { ...items[index], ...updates }
    return items[index]
  }
}

// Bids API
export const bidsApi = {
  getByItemId: async itemId => {
    await delay(300)
    return bids
      .filter(bid => bid.itemId === itemId)
      .sort((a, b) => b.amount - a.amount)
  },

  create: async bidData => {
    await delay(500)
    const item = items.find(i => i.id === bidData.itemId)
    if (!item) {
      throw new Error("Item not found")
    }
    if (bidData.amount <= item.currentHighestBid) {
      throw new Error("Bid must be higher than current highest bid")
    }

    const newBid = {
      ...bidData,
      id: String(bids.length + 1),
      createdAt: new Date().toISOString()
    }
    bids.push(newBid)

    // Update item's current highest bid
    item.currentHighestBid = bidData.amount

    return newBid
  }
}
