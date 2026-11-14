import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-fitverse-bg font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <TopHeader />
        <main className="flex-1 p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

