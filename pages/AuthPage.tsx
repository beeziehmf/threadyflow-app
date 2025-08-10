import React, { useState } from 'react';
import { auth, facebookProvider, googleProvider } from '../services/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { useAppContext } from '../context/AppContext';

export const AuthPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
    const [error, setError] = useState<string | null>(null);
    const { user, updateUser } = useAppContext();

    console.log("AuthPage rendered. Current user:", user);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Email/Password Login successful.");
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("Email/Password Signup successful.");
            }
            // User is automatically signed in after signup/login
            updateUser({ email: email, name: email.split('@')[0] }); // Simple user update
        } catch (err: any) {
            console.error("Auth error:", err);
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            updateUser({ name: '', email: '' }); // Clear user info on logout
            console.log("Logout successful.");
        } catch (err: any) {
            console.error("Logout error:", err);
            setError(err.message);
        }
    };

    const handleFacebookLogin = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, facebookProvider);
            console.log("Facebook Login successful.");
        } catch (err: any) {
            console.error("Facebook Login error:", err);
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            console.log("Google Login successful.");
        } catch (err: any) {
            console.error("Google Login error:", err);
            setError(err.message);
        }
    };

    if (user && user.email) {
        console.log("AuthPage: User is logged in, returning welcome message.");
        return (
            <div className="auth-container card">
                <h2 className="card-title">Welcome, {user.name || user.email}!</h2>
                <button onClick={handleLogout} className="button mt-4">Logout</button>
            </div>
        );
    }

    return (
        <div className="auth-page-wrapper">
            <div className="auth-visual-side">
                {/* Placeholder for images/animations */}
                <h1 className="visual-side-title">Welcome to ThreadFlow</h1>
                <p className="visual-side-subtitle">Automate your social media presence with AI.</p>
                {/* You can add an image here, e.g., <img src="/images/auth-bg.png" alt="Background Visual" /> */}
            </div>
            <div className="auth-form-side">
                <div className="auth-card card">
                    <div className="auth-header">
                        <h1 className="auth-logo">ThreadFlow</h1>
                        <h2 className="auth-title">{isLogin ? 'Login' : 'Sign Up'}</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input 
                                type="email" 
                                id="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="input-text"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password:</label>
                            <input 
                                type="password" 
                                id="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                className="input-text"
                            />
                        </div>
                        {error && <p className="error-message text-red-500 text-sm">{error}</p>}
                        <button type="submit" className="button w-full">
                            {isLogin ? 'Login' : 'Sign Up'}
                        </button>
                    </form>
                    <div className="or-divider">OR</div>
                    <div className="mt-4 space-y-2">
                        <button onClick={handleFacebookLogin} className="button w-full social-button facebook-button">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook Logo" className="social-logo" />
                            Login with Facebook
                        </button>
                        <button onClick={handleGoogleLogin} className="button w-full social-button google-button">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" className="social-logo" />
                            Login with Google
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="button-link mt-4 w-full text-center"
                    >
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};