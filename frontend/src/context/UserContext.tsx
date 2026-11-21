"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  availableUsers: string[];
  addAvailableUser: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>("test-user");
  const [availableUsers, setAvailableUsers] = useState<string[]>(["test-user"]);

  useEffect(() => {
    // Check URL param first
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlUser = params.get("user") || params.get("userId");
      if (urlUser && urlUser.trim()) {
        setUserIdState(urlUser.trim());
        setAvailableUsers((prev) => Array.from(new Set([...prev, urlUser.trim()])));
        return;
      }

      // Check localStorage
      const savedUser = localStorage.getItem("resumme_active_user");
      if (savedUser && savedUser.trim()) {
        setUserIdState(savedUser.trim());
        setAvailableUsers((prev) => Array.from(new Set([...prev, savedUser.trim()])));
      }
    }
  }, []);

  const setUserId = (id: string) => {
    const clean = id.trim();
    if (!clean) return;
    setUserIdState(clean);
    setAvailableUsers((prev) => Array.from(new Set([...prev, clean])));
    if (typeof window !== "undefined") {
      localStorage.setItem("resumme_active_user", clean);
      const url = new URL(window.location.href);
      url.searchParams.set("user", clean);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const addAvailableUser = (id: string) => {
    const clean = id.trim();
    if (clean) {
      setAvailableUsers((prev) => Array.from(new Set([...prev, clean])));
    }
  };

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        availableUsers,
        addAvailableUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
