'use client';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Users,
  UserPlus,
  UserRoundCog,
  ChartColumnIncreasing,
  BookUser,
  List,
  Calendar,
  LogOut,
} from 'lucide-react';

interface SidebarElementProperties {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

interface SidebarElements {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface LogoutElement {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarSections {
  title: string;
  items: SidebarElements[];
}

const SidebarElements = ({ label, icon, active, onClick, collapsed }: SidebarElementProperties) => {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors cursor-pointer ${
        active 
          ? 'bg-[#9f0059] text-white' 
          : 'text-[#9f0059] hover:bg-[#9f0059] hover:text-white'
        }`
      }
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </button>
  );
};

const LogoutElement = ({ label, icon, active, onClick, collapsed }: SidebarElementProperties) => {
  return(
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1.5 px-4 bg-[#f6f0eb] text-[#9f0059] py-3 rounded-4xl 
        font-medium cursor-pointer border border-[#9f0059] ${
        active
          ? 'bg-[#9f0059] text-white'
          : 'text-[#9f0059] hover:bg-[#9f0059] hover:text-white'
      }`
    }
    >
      {icon && <span className='shrink-0'>{icon}</span>}
      {!collapsed && <span className="text-sm font-medium truancate">{label}</span>}
    </button>
  );
};

const SectionHeader = ({title, collapsed}: {title: string; collapsed: boolean }) => {
  if (collapsed) return null;
  return (
    <h3 className="mb-2 px-2 text-base font-bold text-gray-700 tracking-wide">
      {title}
    </h3>
  );
};

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarSections: SidebarSections[] = [
    {
      title: 'Menu',
      items: [
        { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard' }
      ],
    },
    {
      title: 'Volunteers',
      items: [
        { label: 'Overview', icon: <List size={18} />, path: '/volunteers/overview' },
        { label: 'Matching', icon: <Users size={18} />, path: '/volunteers/matching' },
        { label: 'Add New Volunteer', icon: <UserPlus size={18} />, path: '/volunteers/add' },
        { label: 'Edit Volunteer', icon: <UserRoundCog size={18} />, path: '/volunteers/edit' },
        { label: 'Reporting', icon: <ChartColumnIncreasing size={18} />, path: '/volunteers/reporting' },
      ],
    },
    {
      title: 'Schedules',
      items: [
        { label: 'Calendar', icon: <Calendar size={18} />, path: '/calendar' }
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Users', icon: <BookUser size={18} />, path: '/users' }
      ],
    },
  ];

  return (
    <aside
      className={`h-screen flex flex-col bg-[#f6f0eb] border-r transition-[width] duration-300 relative ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top-sidebar - Acara logo and name */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/acara-logo.jpg"
            alt="Acara logo"
            width={65}
            height={65}
            className="rounded-lg shrink-0"
          />
          {!collapsed && (
            <span className="text-lg font-bold text-[#9f0059] truncate">
              Acara Hospice
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className= "absolute -right-3 bg-[#9f0059] rounded-full p-1.5 transition-colors cursor-pointer z-10"
        >
          {collapsed ? <ChevronsRight color="white" size={11} /> : <ChevronsLeft color="white" size={16} />}
        </button>
      </div>

      {/* Mid-sidebar - sections and page links */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} collapsed={collapsed} />
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarElements
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.path}
                  onClick={() => router.push(item.path)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom-sidebar - logout */}
      <div className="p-3">
        <LogoutElement
          label="Logout"
          icon={<LogOut size={20} />}
          active={pathname === '/login'}
          onClick={() => router.push('/login')}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
