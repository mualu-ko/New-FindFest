import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, database } from "../config/firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const provider = new GoogleAuthProvider();

    // 🔹 Sign up logic
    const signUpWithEmail = async () => {
        setError("");
        setLoading(true);

        if (!name.trim()) {
            setError("Name is required for sign up.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name
            });

            await saveUserToDatabase({ ...userCredential.user, displayName: name });

            alert("User Created Successfully!");
            navigate("/");
        } catch (error) {
            handleFirebaseError(error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Log in logic
    const loginWithEmail = async () => {
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Logged in successfully!");
            navigate("/");
        } catch (error) {
            handleFirebaseError(error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Google login/signup logic
    const signInWithGoogle = async () => {
        setError("");
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, provider);
            await saveUserToDatabase(result.user);
            alert("Signed in with Google!");
            navigate("/");
        } catch (error) {
            handleFirebaseError(error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Save user to Firestore
    const saveUserToDatabase = async (user) => {
        const userRef = doc(database, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                name: user.displayName || "Anonymous",
                email: user.email,
                profilePic: user.photoURL || "",
                joinedAt: new Date().toISOString(),
            });
        }
    };

    // 🔹 Firebase error handling
    const handleFirebaseError = (error) => {
        switch (error.code) {
            case "auth/email-already-in-use":
                setError("That email is already in use.");
                break;
            case "auth/invalid-email":
                setError("Invalid email address.");
                break;
            case "auth/weak-password":
                setError("Password should be at least 6 characters.");
                break;
            case "auth/user-not-found":
            case "auth/wrong-password":
                setError("Incorrect email or password.");
                break;
            case "auth/popup-closed-by-user":
                setError("Google sign-in popup was closed.");
                break;
            default:
                setError(error.message || "Something went wrong.");
                break;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        isSignUp ? signUpWithEmail() : loginWithEmail();
    };

    return (
        <div >
            {/* Header section */}
            <h2 className="auth-title">{isSignUp ? "Sign Up" : "Log In"}</h2>

            {/* Google sign-in button (below header) */}
            <button
                className="google-btn"
                onClick={signInWithGoogle}
                disabled={loading}
            >
                {loading ? "Please wait..." : "Sign In with Google"}
            </button>

            {error && <p className="auth-error">{error}</p>}

            <form className="auth-form" onSubmit={handleSubmit}>
                {/* Sign up name input */}
                {isSignUp && (
                    <input
                        className="auth-input"
                        placeholder="Name..."
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                )}

                {/* Email input */}
                <input
                    className="auth-input"
                    placeholder="Email..."
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                
                {/* Password input */}
                <input
                    className="auth-input"
                    placeholder="Password..."
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {/* Already have an account link */}
                <p className="auth-toggle">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <span
                        className="auth-toggle-link"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError("");
                        }}
                    >
                        {isSignUp ? "Log In" : "Sign Up"}
                    </span>
                </p>

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Log In"}
                </button>
            </form>
        </div>
    );
};

export default Auth;
