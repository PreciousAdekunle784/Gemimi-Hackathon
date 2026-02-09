import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

// Sign out on load for testing
signOut(auth);

// --- 2. VISUAL ENGINE ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let items = [];
let currentStage = 'welcome';

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initItems();
}

function initItems() {
    items = [];
    if (['welcome', 'login', 'ui', 'thanks'].includes(currentStage)) {
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

    if (['welcome', 'login', 'ui', 'thanks'].includes(currentStage)) {
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
};

const proceedWithAuth = (name, isNewUser = false) => {
    const thanksTitle = document.querySelector('#stage-thanks .form-title');
    const thanksSub = document.querySelector('#stage-thanks .sub-text');

    if (isNewUser) {
        thanksTitle.innerText = "PROVISIONING SUCCESSFUL";
        thanksSub.innerText = `Welcome to the network, ${name.toUpperCase()}.`;
    } else {
        thanksTitle.innerText = "IDENTITY VERIFIED";
        thanksSub.innerText = `Welcome back, OPERATOR ${name.toUpperCase()}.`;
    }

    window.toStage('stage-thanks');

    setTimeout(() => {
        window.toStage('stage-boot');
        runBoot(name);
    }, 2500);
};

window.handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        proceedWithAuth(result.user.displayName || "Operator", false);
    } catch (error) {
        console.error("Auth Failure:", error.message);
        alert("CONNECTION ERROR: " + error.message);
    }
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        proceedWithAuth(userCredential.user.displayName || "Operator", false);
    } catch (err) {
        alert("ACCESS DENIED: " + err.message);
    }
};

window.handleSignup = async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value;
    const name = document.getElementById('userName').value;
    const pass = document.getElementById('userPass').value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(userCredential.user, { displayName: name });
        proceedWithAuth(name, true);
    } catch (err) {
        alert("PROVISIONING FAILED: " + err.message);
    }
};

// --- 4. SYSTEM BOOT & AI LOGIC ---
function runBoot(name) {
    const logs = ["Provisioning ID...", "Linking Gemini 3...", "Neural Handshake Established.", "Ready."];
    let progress = 0, logIdx = 0;
    const logBox = document.getElementById('logContainer');
    logBox.innerHTML = '';

    const interval = setInterval(() => {
        progress += 2;
        if (progress >= 100) {
            clearInterval(interval);
            document.getElementById('finalUserMsg').innerText = `OPERATOR: ${name.toUpperCase()}`;
            setTimeout(() => window.toStage('stage-ui'), 800);
        }
        document.getElementById('percent').innerText = progress + "%";
        if (progress > (logIdx * 25) && logIdx < logs.length) {
            const div = document.createElement('div');
            div.innerHTML = `> ${logs[logIdx]}`;
            logBox.appendChild(div);
            logIdx++;
        }
    }, 40);
}

window.runGeminiLogic = async () => {
    const logBox = document.getElementById('reasoningLog');
    const logEntry = (text) => {
        const div = document.createElement('div');
        div.innerHTML = `> ${text}`;
        logBox.prepend(div);
    };

    try {
        logEntry("Initializing Gemini 3 Neural Link...");
        const response = await fetch('http://127.0.0.1:3000/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: "Analyze this connection for social engineering tactics." })
        });

        if (!response.ok) throw new Error("Backend connection failed.");
        const data = await response.json();

        if (data.output) {
            const lines = data.output.split('\n');
            for (let line of lines) {
                if (line.trim()) {
                    await new Promise(r => setTimeout(r, 600));
                    logEntry(line.replace(/[#*]/g, ''));
                }
            }
        }
    } catch (err) {
        logEntry("CRITICAL ERROR: Neural Link Severed.");
    }
};

// --- 5. INITIALIZATION ---
window.addEventListener('resize', resize);

// Single reliable startup trigger
window.onload = () => {
    resize();
    draw();
    console.log("Visual Engine Online.");
};