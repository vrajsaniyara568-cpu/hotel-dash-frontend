import { Outlet } from "react-router-dom";
import { HotelSidebar } from "./HotelSidebar";
import { useEffect } from "react";
import { initializeSampleData } from "@/lib/storage";

export function Layout() {
  useEffect(() => {
    // Initialize sample data on first load
    initializeSampleData();
  }, []);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <HotelSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}