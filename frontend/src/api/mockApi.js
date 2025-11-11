// Mock API using localStorage

const STORAGE_KEYS = {
  USERS: 'veranda_users',
  LISTINGS: 'veranda_listings',
  COMPLAINTS: 'veranda_complaints',
  RATINGS: 'veranda_ratings',
  FOOD_ITEMS: 'veranda_food_items',
  MENU_SCHEDULE: 'veranda_menu_schedule',
  NOTICES: 'veranda_notices'
};

// Initialize demo data
const initData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUsers = [
      {
        id: '0c5c27ff-7703-4297-a494-26fec3287928',
        fullName: 'Student Demo',
        email: 'student@demo.com',
        password: 'demo123',
        roles: ['student'],
        domainAdminOf: []
      },
      {
        id: '2',
        fullName: 'Mess Admin Demo',
        email: 'messadmin@demo.com',
        password: 'demo123',
        roles: ['student', 'domain_admin'],
        domainAdminOf: ['mess']
      },
      {
        id: '0c5c27ff-7703-4297-a494-26fec3287928',
        fullName: 'Super Admin Demo',
        email: 'superadmin@demo.com',
        password: 'demo123',
        roles: ['super_admin'],
        domainAdminOf: []
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    const demoListings = [
      {
        id: '1',
        title: 'Used Bicycle',
        price: 2500,
        sellerName: 'John Doe',
        sellerPhone: '9876543210',
        status: 'active'
      },
      {
        id: '2',
        title: 'Study Desk',
        price: 1500,
        sellerName: 'Jane Smith',
        sellerPhone: '9876543211',
        status: 'active'
      },
      {
        id: '3',
        title: 'Laptop Charger',
        price: 800,
        sellerName: 'Bob Johnson',
        sellerPhone: '9876543212',
        status: 'closed'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(demoListings));
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
    const demoComplaints = [
      {
        id: '1',
        studentId: '1',
        subject: 'Food quality issue',
        detail: 'Lunch was undercooked today',
        status: 'open',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        studentId: '1',
        subject: 'Late dinner service',
        detail: 'Dinner was served 30 minutes late',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(demoComplaints));
  }

  if (!localStorage.getItem(STORAGE_KEYS.RATINGS)) {
    const demoRatings = [
      { meal: 'breakfast', item: 'Poha', avgStars: 4.5 },
      { meal: 'lunch', item: 'Dal Rice', avgStars: 4.2 },
      { meal: 'dinner', item: 'Roti Sabji', avgStars: 3.8 },
      { meal: 'breakfast', item: 'Upma', avgStars: 3.5 },
      { meal: 'lunch', item: 'Rajma Chawal', avgStars: 4.8 },
      { meal: 'dinner', item: 'Paneer Curry', avgStars: 4.6 }
    ];
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(demoRatings));
  }

  if (!localStorage.getItem(STORAGE_KEYS.FOOD_ITEMS)) {
    const demoFoodItems = [
      { id: '1', name: 'Poha', category: 'breakfast' },
      { id: '2', name: 'Upma', category: 'breakfast' },
      { id: '3', name: 'Dal Rice', category: 'lunch' },
      { id: '4', name: 'Rajma Chawal', category: 'lunch' },
      { id: '5', name: 'Roti Sabji', category: 'dinner' },
      { id: '6', name: 'Paneer Curry', category: 'dinner' },
      { id: '7', name: 'Samosa', category: 'snacks' },
      { id: '8', name: 'Tea', category: 'snacks' }
    ];
    localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(demoFoodItems));
  }

  if (!localStorage.getItem(STORAGE_KEYS.MENU_SCHEDULE)) {
    const demoSchedule = [
      {
        day: 'Monday',
        date: new Date().toISOString().split('T')[0],
        slots: {
          breakfast: { time: '08:00 - 09:30', items: ['Poha', 'Tea'] },
          lunch: { time: '12:30 - 14:00', items: ['Dal Rice', 'Roti'] },
          snacks: { time: '16:00 - 17:00', items: ['Samosa', 'Tea'] },
          dinner: { time: '19:30 - 21:00', items: ['Roti Sabji', 'Rice'] }
        }
      }
    ];
    localStorage.setItem(STORAGE_KEYS.MENU_SCHEDULE, JSON.stringify(demoSchedule));
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTICES)) {
    const demoNotices = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        text: 'Mess will be closed on Sunday for maintenance.',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(demoNotices));
  }
};

initData();

// Users
export const getUsers = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
};

export const createUser = (userData) => {
  const users = getUsers();
  const newUser = {
    id: Date.now().toString(),
    ...userData,
    roles: userData.roles || ['student'],
    domainAdminOf: userData.domainAdminOf || []
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return newUser;
};

export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email);
};

export const setUserRoles = (userId, roles) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.roles = roles;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

export const setDomainAdmin = (userId, domainKey, enabled) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    if (enabled) {
      if (!user.domainAdminOf.includes(domainKey)) {
        user.domainAdminOf.push(domainKey);
      }
      if (!user.roles.includes('domain_admin')) {
        user.roles.push('domain_admin');
      }
    } else {
      user.domainAdminOf = user.domainAdminOf.filter(d => d !== domainKey);
      if (user.domainAdminOf.length === 0) {
        user.roles = user.roles.filter(r => r !== 'domain_admin');
      }
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

// OLX Listings
export const getListings = ({ q = '', includeInactive = false } = {}) => {
  let listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
  if (q) {
    listings = listings.filter(l => l.title.toLowerCase().includes(q.toLowerCase()));
  }
  if (!includeInactive) {
    listings = listings.filter(l => l.status === 'active');
  }
  return listings;
};

export const closeListing = (id) => {
  const listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
  const listing = listings.find(l => l.id === id);
  if (listing) {
    listing.status = 'closed';
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }
};

// Mess Complaints
export const getMyComplaints = (studentId) => {
  const complaints = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS) || '[]');
  return complaints.filter(c => c.studentId === studentId);
};

export const getAllComplaints = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPLAINTS) || '[]');
};

export const createComplaint = (complaintData) => {
  const complaints = getAllComplaints();
  const newComplaint = {
    id: Date.now().toString(),
    ...complaintData,
    status: 'open',
    createdAt: new Date().toISOString()
  };
  complaints.push(newComplaint);
  localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
  return newComplaint;
};

export const deleteMyOpenComplaint = (id, studentId) => {
  const complaints = getAllComplaints();
  const complaint = complaints.find(c => c.id === id && c.studentId === studentId && c.status === 'open');
  if (complaint) {
    const updated = complaints.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(updated));
    return true;
  }
  return false;
};

export const updateComplaintStatus = (id, status) => {
  const complaints = getAllComplaints();
  const complaint = complaints.find(c => c.id === id);
  if (complaint) {
    complaint.status = status;
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
  }
};

// Mess Ratings
export const getWeeklyRatings = () => {
  const ratings = JSON.parse(localStorage.getItem(STORAGE_KEYS.RATINGS) || '[]');
  return ratings.sort((a, b) => b.avgStars - a.avgStars);
};

// Food Items
export const getFoodItems = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_ITEMS) || '[]');
};

export const createFoodItem = (foodData) => {
  const items = getFoodItems();
  const newItem = {
    id: Date.now().toString(),
    ...foodData
  };
  items.push(newItem);
  localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
  return newItem;
};

export const updateFoodItem = (id, foodData) => {
  const items = getFoodItems();
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...foodData };
    localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
  }
};

export const deleteFoodItem = (id) => {
  const items = getFoodItems();
  const updated = items.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(updated));
};

// Menu Schedule
export const getMenuSchedule = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MENU_SCHEDULE) || '[]');
};

export const updateMenuSchedule = (scheduleData) => {
  localStorage.setItem(STORAGE_KEYS.MENU_SCHEDULE, JSON.stringify(scheduleData));
};

// Notices
export const getNotices = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTICES) || '[]');
};

export const createNotice = (noticeData) => {
  const notices = getNotices();
  const newNotice = {
    id: Date.now().toString(),
    ...noticeData,
    createdAt: new Date().toISOString()
  };
  notices.push(newNotice);
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  return newNotice;
};

export const updateNotice = (id, noticeData) => {
  const notices = getNotices();
  const index = notices.findIndex(notice => notice.id === id);
  if (index !== -1) {
    notices[index] = { ...notices[index], ...noticeData };
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  }
};

export const deleteNotice = (id) => {
  const notices = getNotices();
  const updated = notices.filter(notice => notice.id !== id);
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(updated));
};