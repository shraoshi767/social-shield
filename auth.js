import { auth } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- LOGIN LOGIC ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html"; // Redirect on success
        } catch (error) {
            alert("Authentication Failed: " + error.message);
        }
    });
}

// --- SIGNUP LOGIC ---
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Account Created! Redirecting to Dashboard...");
            window.location.href = "dashboard.html";
        } catch (error) {
            alert("Registration Failed: " + error.message);
        }
    });
}

// --- LOGOUT LOGIC ---
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = "login.html";
    });
}

// --- ROUTE PROTECTION ---
// Check if user is logged in. If not, kick them back to login page.
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname;
    
    // If on dashboard and not logged in
    if (currentPage.includes('dashboard.html') && !user) {
        window.location.href = "login.html";
    }
    
    // If on login/signup and already logged in
    if ((currentPage.includes('login.html') || currentPage.includes('signup.html')) && user) {
        window.location.href = "dashboard.html";
    }
});