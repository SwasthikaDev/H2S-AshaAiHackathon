// API URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:9002/api' 
    : 'https://asha-ai-h2s.swasthikadevadiga2.workers.dev/api';

// Check authentication on protected pages
function checkAuth() {
    const token = localStorage.getItem('token');
    const protectedPages = ['index.html', '/', '/index.html'];
    const currentPage = window.location.pathname.split('/').pop() || '/';
    
    if (protectedPages.includes(currentPage)) {
        if (!token) {
            window.location.href = '/login.html';
        }
    } else if (currentPage === 'login.html' || currentPage === 'signup.html') {
        if (token) {
            window.location.href = '/index.html';
        }
    }
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', checkAuth);

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                
                // Store user's name if available
                if (data.name) {
                    localStorage.setItem('userName', data.name);
                } else {
                    // Extract name from email as fallback
                    const nameFromEmail = email.split('@')[0];
                    localStorage.setItem('userName', nameFromEmail);
                }
                
                // Redirect to home page
                window.location.href = '/';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login');
        }
    });
}

// Handle signup form submission
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                
                // Store user's name
                localStorage.setItem('userName', name);
                
                // Redirect to home page
                window.location.href = '/';
            } else {
                alert(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during signup');
        }
    });
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/login.html';
}

// Add authentication header to requests
function getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}
