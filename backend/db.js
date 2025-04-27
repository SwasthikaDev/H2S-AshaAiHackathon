const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'users.json');

// Initialize database if it doesn't exist
async function initDB() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.writeFile(DB_PATH, '[]');
    }
}

// Read all users
async function getUsers() {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
}

// Save users to file
async function saveUsers(users) {
    await fs.writeFile(DB_PATH, JSON.stringify(users, null, 2));
}

// Find user by email
async function findUserByEmail(email) {
    const users = await getUsers();
    return users.find(user => user.email === email);
}

// Create new user
async function createUser(userData) {
    const users = await getUsers();
    
    // Check if user count exceeds limit
    if (users.length >= 20) {
        throw new Error('Maximum user limit reached');
    }

    // Check if email already exists
    if (users.some(user => user.email === userData.email)) {
        throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 8);
    const newUser = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await saveUsers(users);
    return newUser;
}

// Verify user credentials
async function verifyUser(email, password) {
    const user = await findUserByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
}

module.exports = {
    initDB,
    findUserByEmail,
    createUser,
    verifyUser
};
