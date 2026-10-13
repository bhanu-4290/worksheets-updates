import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 px-3 sm:px-5 lg:px-6 pt-2 sm:pt-3 lg:pt-3.5 pb-16 sm:pb-20 max-w-7xl w-full mx-auto">
          {children || <Outlet />}
        </main>
        <footer className="fixed bottom-0 right-0 left-0 lg:left-64 z-20 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>MATRIX - WorkTrack Operations Platform (Support: gbhanu2811@gmail.com | 7337504290)</span>
            <div className="flex flex-wrap items-center gap-4 font-medium">
              <Link to="/how-to-use" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                How to Use
              </Link>
              <Link to="/privacy-policy" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
