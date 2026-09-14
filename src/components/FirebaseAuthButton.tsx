import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Database
} from 'lucide-react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithMicrosoft, signInWithGoogle, signInGuest, logOut } from '../firebase';

export const FirebaseAuthButton: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleMicrosoftLogin = async () => {
    setAuthError(null);
    try {
      await signInWithMicrosoft();
      setDropdownOpen(false);
    } catch (err: unknown) {
      console.error('Microsoft login failed:', err);
      // If popup blocked or failed, show notice
      setAuthError('Login popup closed or not allowed.');
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      setDropdownOpen(false);
    } catch (err: unknown) {
      console.error('Google login failed:', err);
      setAuthError('Login popup closed or not allowed.');
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    try {
      await signInGuest();
      setDropdownOpen(false);
    } catch (err: unknown) {
      console.error('Guest auth failed:', err);
      setAuthError('Guest connection failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setDropdownOpen(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-400 text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
        <span className="hidden sm:inline">Firebase...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-5 h-5 rounded-full object-cover border border-stone-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="hidden lg:flex flex-col text-left leading-tight max-w-[130px]">
            <span className="text-[11px] font-bold text-stone-900 truncate">
              {user.displayName || user.email?.split('@')[0] || 'SCIS Teacher'}
            </span>
            <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SCIS Connected
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 p-2.5 z-50 animate-fade-in text-xs">
            <div className="p-2 border-b border-stone-100 mb-1.5">
              <div className="font-bold text-stone-900 truncate">{user.displayName || 'SCIS Educator'}</div>
              <div className="text-[11px] text-stone-500 truncate">{user.email || 'Anonymous Guest Session'}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md w-fit">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                <span>scis-house-points</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-rose-700 hover:bg-rose-50 font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-200 transition-all active:scale-95"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>SCIS Login</span>
        <ChevronDown className="w-3 h-3 opacity-80" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 animate-fade-in text-xs space-y-1">
          <div className="px-2.5 py-2 border-b border-stone-100 text-[11px] font-bold text-stone-500">
            Authenticate to SCIS Firebase
          </div>

          {authError && (
            <div className="p-2 text-[11px] bg-rose-50 text-rose-700 rounded-lg font-medium">
              {authError}
            </div>
          )}

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-stone-800 hover:bg-stone-100 font-semibold transition-colors"
          >
            <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
              M
            </div>
            <span>Microsoft (@scis-bo.com)</span>
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-stone-800 hover:bg-stone-100 font-semibold transition-colors"
          >
            <div className="w-4 h-4 rounded bg-red-500 text-white flex items-center justify-center text-[10px] font-black">
              G
            </div>
            <span>Google Account</span>
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-stone-400" />
            <span>Connect without Sign-in</span>
          </button>
        </div>
      )}
    </div>
  );
};
