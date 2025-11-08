// Mock API using localStorage

const STORAGE_KEYS = {
  USERS: 'veranda_users',
  LISTINGS: 'veranda_listings',
  COMPLAINTS: 'veranda_complaints',
  RATINGS: 'veranda_ratings'
};

// Initialize demo data
const initData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUsers = [
      {
        id: '1',
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
        id: '3',
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
