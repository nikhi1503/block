"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import React from "react";

interface LogoutButtonProps {
  logoutUrl: string;
  redirectTo: string;
  children?: React.ReactNode;
  onLogoutClick?: () => void;
}

export default function LogoutButton({
  logoutUrl,
  redirectTo,
  children,
  onLogoutClick,
}: LogoutButtonProps) {
  const router = useRouter();

  const confirmLogout = () => {
    onLogoutClick?.(); // Close dropdown immediately

    const toastId = toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-2">Are you sure you want to logout?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                closeToast && closeToast();
              }}
              className="px-3 py-1 rounded bg-gray-300 text-black text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                closeToast && closeToast();
                await handleLogout();
              }}
              className="px-3 py-1 rounded bg-red-600 text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        closeOnClick: false,
        closeButton: false,
        autoClose: false,
        draggable: false,
        pauseOnHover: false,
      }
    );
  };

  const handleLogout = async () => {
    try {
      // Get token from sessionStorage or localStorage
      const accessToken = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      
      const headers: any = {
        "Content-Type": "application/json",
      };
      
      // Add Authorization header if token exists
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      console.log("Attempting logout with URL:", logoutUrl);
      console.log("Headers:", headers);
      
      const response = await fetch(logoutUrl, {
        method: "POST",
        credentials: "include",
        headers,
      });

      console.log("Logout response status:", response.status);
      console.log("Logout response headers:", response.headers);

      // Clear storage immediately
      sessionStorage.clear();
      localStorage.clear();

      if (!response.ok) {
        console.warn("Logout API returned non-OK status:", response.status);
        toast.error(`Logout failed with status ${response.status}`);
        return;
      }

      const contentType = response.headers.get("content-type");
      
      try {
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          console.log("Logout API response:", result);
          toast.success("Logged out successfully");
        } else {
          console.log("Non-JSON response received");
          toast.success("Logged out successfully");
        }
      } catch (parseError) {
        console.warn("Could not parse response as JSON:", parseError);
        toast.success("Logged out successfully");
      }

      // Redirect after short delay
      setTimeout(() => {
        console.log("Redirecting to:", redirectTo);
        router.push(redirectTo);
      }, 1000);
      
    } catch (error: any) {
      console.error("Logout error:", error);
      // Still clear storage even if API call fails
      sessionStorage.clear();
      localStorage.clear();
      toast.error(error.message || "Logout failed");
      // Redirect anyway after delay
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
    }
  };

  return (
    <button onClick={confirmLogout}>
      {children ? children : "Logout"}
    </button>
  );
}