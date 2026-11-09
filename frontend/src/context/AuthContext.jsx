import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "../services/authService";
import { mergeGuestCart } from "../services/cartService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user profile on startup if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token) {
        try {
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          const profileData = await getCurrentUser();
          setProfile(profileData);
        } catch (err) {
          console.warn("Could not fetch current profile, clearing session.", err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login handler with persistent guest cart merging
  const login = async (authResponse) => {
    const userData = authResponse.user || authResponse;
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    if (authResponse.profile) {
      setProfile(authResponse.profile);
    } else {
      try {
        const p = await getCurrentUser();
        setProfile(p);
      } catch (e) {}
    }

    // Merge guest cart items into user's DB cart
    try {
      const storedGuestCart = localStorage.getItem("guest_cart") || localStorage.getItem("cart");
      if (storedGuestCart) {
        const guestItems = JSON.parse(storedGuestCart);
        if (Array.isArray(guestItems) && guestItems.length > 0) {
          await mergeGuestCart(guestItems);
          console.log("Guest cart merged successfully upon login.");
        }
      }
    } catch (e) {
      console.warn("Guest cart merge error", e);
    }
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    logoutUser();
  };

  const updateProfileState = (newProfile) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        updateProfileState,
        isAuthenticated: !!user,
        isEmailVerified: profile?.email_verified ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
