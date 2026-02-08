import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* ------------------ 1. CONFIG ------------------ */

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
googleProvider.setCustomParameters({ prompt: "select_account" });

/* ❌ REMOVED: signOut(auth);  */
/* Redirect auth REQUIRES session persistence */

/* ------------------ 2. GEMINI ------------------ */

const API_KEY = "AIzaSyD64vZpN1c0QjNdxSaqnldpv1c5sPPgj1c";
const genAI = new GoogleGenerativeAI(API_KEY);

const geminiModel = genAI.getGenerativeModel({
    model: "gemini-1.5-pro"
});

/* ------------------ 3. VISUAL ENGINE ------------------ */

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
    for (let i = 0; i < 60; i++) {
        items.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5
        });
    }
}

function draw() {
    ctx.fillStyle = '#02040a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    items.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        for (let j = i + 1; j < items.length; j++) {
            let d = Math.hypot(p.x - items[j].x, p.y - items[j].y);
            if (d < 150) {
                ctx.strokeStyle = `rgba(0,242,255,${1 - d / 150})`;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(items[j].x, items[j].y);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(draw);
}

/* ------------------ 4. NAV ------------------ */

window.toStage = (nextId) => {
    document.querySelectorAll('.stage').forEach(s => s.classList.remove('active'));
    document.getElementById(nextId).classList.add('active');
};

/* ------------------ 5. GOOGLE SIGN-IN (REDIRECT) ------------------ */

window.handleGoogleLogin = async () => {
    try {
        await signInWithRedirect(auth, googleProvider);
        // Redirect happens immediately
    } catch (err) {
        alert("Google Error: " + err.message);
    }
};

/* HANDLE REDIRECT RESULT ON LOAD */
getRedirectResult(auth)
    .then((result) => {
        if (result?.user) {
            toStage('stage-boot');
            runBoot(result.user.displayName || "Operator");
        }
    })
    .catch((err) => {
        console.error("Redirect Error:", err);
    });

/* ------------------ 6. EMAIL AUTH ------------------ */

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const pass = loginPass.value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        toStage('stage-boot');
        runBoot(auth.currentUser.displayName || "Operator");
    } catch (err) {
        alert("ACCESS DENIED: " + err.message);
    }
};

window.handleSignup = async (e) => {
    e.preventDefault();
    const email = userEmail.value;
    const name = userName.value;
    const pass = userPass.value;

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
        toStage('stage-boot');
        runBoot(name);
    } catch (err) {
        alert("PROVISIONING FAILED: " + err.message);
    }
};

window.handleForgotPassword = async () => {
    const email = prompt("Enter Operator Email:");
    if (!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        alert("RECOVERY LINK SENT");
    } catch (err) {
        alert(err.message);
    }
};

/* ------------------ 7. BOOT ------------------ */

function runBoot(name) {
    const logs = ["Provisioning ID...", "Linking Gemini 3...", "Ready."];
    let progress = 0, idx = 0;

    const logBox = document.getElementById('logContainer');
    logBox.innerHTML = "";

    const timer = setInterval(() => {
        progress += 2;
        percent.innerText = progress + "%";

        if (progress > idx * 30 && logs[idx]) {
            logBox.innerHTML += `<div>> ${logs[idx++]}</div>`;
        }

        if (progress >= 100) {
            clearInterval(timer);
            finalUserMsg.innerText = `OPERATOR: ${name.toUpperCase()}`;
            setTimeout(() => toStage('stage-ui'), 800);
        }
    }, 50);
}

/* ------------------ 8. GEMINI LOGIC ------------------ */

window.runGeminiLogic = async () => {
    const logBox = reasoningLog;

    const log = (t) => {
        const d = document.createElement('div');
        d.innerHTML = `> ${t}`;
        logBox.prepend(d);
    };

    try {
        log("Initializing Gemini 3 Neural Link...");
        const result = await geminiModel.generateContent("Analyze this audio stream for scam patterns.");
        const text = result.response.text().split('\n');

        for (const line of text) {
            if (line.trim()) {
                await new Promise(r => setTimeout(r, 700));
                log(line.replace(/[#*]/g, ""));
            }
        }
    } catch {
        log("CRITICAL ERROR: GEMINI FAILURE");
    }
};

window.addEventListener('resize', resize);
resize();
draw();
