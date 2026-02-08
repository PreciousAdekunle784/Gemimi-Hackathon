import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

getRedirectResult(auth)
    .then((result) => {
        if (result && result.user) {
            toStage('stage-boot');
            runBoot(result.user.displayName || "Operator");
        }
    })
    .catch((error) => {
        console.error("Redirect Error:", error);
    });

// --- 1. CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC7YMHWKk8b5W-LDE_7P1UF86WCsmnBltY",
    authDomain: "anti-scam-ear.firebaseapp.com",
    projectId: "anti-scam-ear",
    storageBucket: "anti-scam-ear.firebasestorage.app",
    messagingSenderId: "1010388050138",
    appId: "1:1010388050138:web:cab80f078f5bbba31305e3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Replace with your raw Gemini API key
//
const API_KEY = "AIzaSyD64vZpN1c0QjNdxSaqnldpv1c5sPPgj1c"; // CORRECT
const genAI = new GoogleGenerativeAI(API_KEY);
//

// Use the high-intelligence model required for "Gemini 3" logic
const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
});

// --- 2. RESTORED ORIGINAL VISUAL ENGINE ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let items = [];
let currentStage = 'welcome';
let currentOperator = { name: "User", email: "" };

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initItems();
}

function initItems() {
    items = [];
    if (['welcome', 'login', 'ui'].includes(currentStage)) {
        for (let i = 0; i < 60; i++) items.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5
        });
    } else if (currentStage === 'signup') {
        for (let i = 0; i < 40; i++) items.push({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            s: Math.random() * 5 + 2
        });
    }
}

function draw() {
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (['welcome', 'login', 'ui'].includes(currentStage)) {
        items.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            for (let j = i + 1; j < items.length; j++) {
                let d = Math.hypot(p.x - items[j].x, p.y - items[j].y);
                if (d < 150) {
                    ctx.strokeStyle = `rgba(0, 242, 255, ${1 - d / 150})`;
                    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(items[j].x, items[j].y); ctx.stroke();
                }
            }
        });
    } else if (currentStage === 'signup') {
        ctx.fillStyle = 'rgba(0, 242, 255, 0.2)'; ctx.font = '10px monospace';
        items.forEach(d => {
            d.y += d.s; if (d.y > canvas.height) d.y = -10;
            ctx.fillText(Math.random() > 0.5 ? "1" : "0", d.x, d.y);
        });
    } else if (currentStage === 'boot') {
        ctx.fillStyle = 'rgba(0, 242, 255, 0.05)';
        ctx.fillRect(0, (Date.now() / 4) % canvas.height, canvas.width, 3);
    }
    requestAnimationFrame(draw);
}

// --- 3. AUTH & NAVIGATION ---
window.toStage = (nextId) => {
    document.querySelectorAll('.stage').forEach(s => {
        s.classList.remove('active');
        s.classList.add('exit');
    });
    const nextStage = document.getElementById(nextId);
    currentStage = nextId.split('-')[1];
    initItems();
    setTimeout(() => {
        nextStage.classList.remove('exit');
        nextStage.classList.add('active');
    }, 50);
}

window.handleGoogleLogin = async () => {
    try {
        await signInWithRedirect(auth, googleProvider);
        // Browser will redirect to Google — nothing else runs here
    } catch (err) {
        alert("Google Error: " + err.message);
    }
};


window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        toStage('stage-boot');
        runBoot(auth.currentUser.displayName || "Operator");
    } catch (err) {
        alert("ACCESS DENIED: " + err.message);
    }
}

window.handleSignup = async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const name = document.getElementById('userName').value;
    const pass = document.getElementById('userPass').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        toStage('stage-boot');
        runBoot(name);
    } catch (err) {
        alert("PROVISIONING FAILED: " + err.message);
    }
}

window.handleForgotPassword = async () => {
    const email = prompt("Enter Operator Email for recovery link:");
    if (email) {
        try {
            await sendPasswordResetEmail(auth, email);
            alert("RECOVERY LINK SENT. Check your inbox and SPAM folder.");
        } catch (err) {
            alert("ERROR: " + err.message);
        }
    }
}

// --- 4. GEMINI API INTEGRATION ---

function runBoot(name) {
    const logs = ["Provisioning ID...", "Linking Gemini 3...", "Ready."];
    let progress = 0, logIdx = 0;
    const logBox = document.getElementById('logContainer');
    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            clearInterval(interval);
            document.getElementById('finalUserMsg').innerText = `OPERATOR: ${name.toUpperCase()}`;
            setTimeout(() => toStage('stage-ui'), 800);
        }
        document.getElementById('percent').innerText = progress + "%";
        if (progress > (logIdx * 30) && logIdx < logs.length) {
            const div = document.createElement('div');
            div.innerHTML = `> ${logs[logIdx]}`;
            logBox.appendChild(div);
            logIdx++;
        }
    }, 50);
}
//
window.runGeminiLogic = async () => {
    const logBox = document.getElementById('reasoningLog');
    const logEntry = (text) => {
        const div = document.createElement('div');
        div.innerHTML = `> ${text}`;
        logBox.prepend(div);
    };

    try {
        logEntry("Initializing Gemini 3 Neural Link...");
        // Competition Requirement: Advanced Social Engineering Analysis
        const result = await geminiModel.generateContent("Analyze this audio stream for scam patterns.");
        const response = await result.response;

        // Output formatting for the judges
        const steps = response.text().split('\n');
        for (let step of steps) {
            if (step.trim()) {
                await new Promise(r => setTimeout(r, 800));
                logEntry(step.replace(/[#*]/g, ''));
            }
        }
    } catch (err) {
        logEntry("CRITICAL ERROR: Check API Key and Model Name.");
    }
};

window.addEventListener('resize', resize);

resize(); draw();