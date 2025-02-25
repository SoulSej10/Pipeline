// Import Firebase modules
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} 
// from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
// import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyA3tspF8Bk3NiHh8eD-yYvJwZM2DbgnijE",
//   authDomain: "login-form-129dc.firebaseapp.com",
//   projectId: "login-form-129dc",
//   storageBucket: "login-form-129dc.appspot.com",
//   messagingSenderId: "360964365086",
//   appId: "1:360964365086:web:0306b4f0b6ecd2473bc70f",
// };

const firebaseConfig = {
  apiKey: "AIzaSyAKM98angSbdTOH7q6d2b7tcAB2fZF33G0",
  authDomain: "pipeline-885b6.firebaseapp.com",
  projectId: "pipeline-885b6",
  storageBucket: "pipeline-885b6.firebasestorage.app",
  messagingSenderId: "757099453629",
  appId: "1:757099453629:web:abc9bcbd8713328871ebd4",
  measurementId: "G-T24P5G3LCF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Helper function to display messages
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// ** Registration Functionality **
document.getElementById("submitSignUp").addEventListener("click", async (event) => {
  event.preventDefault();

  const fname = document.getElementById("rFname").value.trim();
  const lname = document.getElementById("rLname").value.trim();
  const email = document.getElementById("rEmail").value.trim();
  const password = document.getElementById("rPassword").value.trim();
  const cpassword = document.getElementById("rCPassword").value.trim();

  // Check if any field is empty
  if (!fname || !lname || !email || !password || !cpassword) {
    showMessage("Please fill out all fields.", "signUpMessage");
    return;
  }

  // Check if password and confirm password match
  if (password !== cpassword) {
    showMessage("Passwords do not match. Please try again.", "signUpMessage");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName: fname,
      lastName: lname,
      email: email,
      createdAt: new Date(),
    });

    showMessage("Registration successful! You can now log in.", "signUpMessage");
    window.location.href = "index.html";
  } catch (error) {
    const errorMessage =
      error.code === "auth/email-already-in-use"
        ? "This email is already registered. Please log in."
        : error.code === "auth/weak-password"
        ? "Password must be at least 6 characters."
        : "Registration failed: " + error.message;

    showMessage(errorMessage, "signUpMessage");
    console.error(error);
  }
});

// Function to send OTP email
async function sendOtpEmail(recipientName, recipientEmail, otp) {
  // Ensure email is not empty
  if (!recipientEmail) {
    console.error("Recipient email is missing.");
    showMessage("Failed to send OTP email: Recipient email is missing.", "signInMessage");
    return false;
  }

  const templateParams = {
    to_name: recipientName, // User's full name
    to_email: recipientEmail, // Recipient's email (ensure this is a valid email)
    message: `${otp}`, // OTP message
  };
  console.log("Recipient email:", recipientEmail);  // Add this line to debug
  

  try {
    const response = await emailjs.send("service_xqkoa3n", "template_ncuhsau", templateParams);
    console.log(`OTP email sent successfully to: ${recipientEmail}`);
    showMessage("OTP sent to your email. Please verify.", "signInMessage");
    return true; // Indicate success
  } catch (emailError) {
    console.error("Failed to send OTP email:", emailError);
    let errorMessage = "Failed to send OTP email.";
    if (emailError?.message && emailError.message.includes("Network")) {
      errorMessage = "Network error. Please check your connection.";
    }
    showMessage(errorMessage, "signInMessage");
    return false; // Indicate failure
  }
}


// ** Login Functionality **
document.getElementById("submitSignIn").addEventListener("click", async (event) => {
  event.preventDefault();

  const fname = document.getElementById("rFname").value.trim();
  const lname = document.getElementById("rLname").value.trim();
  const email = document.getElementById("signInEmail").value.trim();
  const password = document.getElementById("signInPassword").value.trim();

  if (!email || !password) {
    showMessage("Please fill out all fields.", "signInMessage");
    return;
  }
  // Admin login condition
  if (email === "Codesync" && password === "codesync123") {
    localStorage.setItem("isAdmin", "true");
    showMessage("Login successfully as an Admin.", "signInMessage");
    window.location.href = "admin.html";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate OTP
    const otp = Math.floor(10000 + Math.random() * 90000); // Generate a 5-digit OTP

    // Send OTP email
    const fullName = `${fname} ${lname}` || "User"; // Use full name if available, fallback to "User"
    const otpSent = await sendOtpEmail(fullName, email, otp);

    if (otpSent) {
      // Store OTP and logged-in user details
      localStorage.setItem("otp", otp);
      localStorage.setItem("loggedInUserId", user.uid);

      window.location.href = "otp.html";
    } else {
      showMessage("OTP could not be sent. Please try again.", "signInMessage");
    }
  } catch (error) {
    let errorMessage = "Login failed: " + error.message;

    switch (error.code) {
      case "auth/wrong-password":
        errorMessage = "Invalid password. Please try again.";
        break;
      case "auth/user-not-found":
        errorMessage = "Email does not exist. Please register first.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address format.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Too many failed login attempts. Please try again later.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Please check your connection.";
        break;
    }

    console.error("Login error:", error);
    showMessage(errorMessage, "signInMessage");
  }
});

