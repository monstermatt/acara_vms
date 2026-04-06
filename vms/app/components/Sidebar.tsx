'use client';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from "next-auth/react"
import { Dispatch, SetStateAction } from 'react';

/* importing SVG icons*/
import {
  DashboardIcon,
  VolunteersIcon,
  MatchingIcon,
  ReportingIcon,
  CalendarIcon,
  UsersIcon,
  MessageIcon,
  LogoutIcon
} from '@/icons';

import {
  ChevronsLeft,
  ChevronsRight
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
      className={`sidebar-elements ${active
          ? 'sidebar-element-active'
          : 'sidebar-element-hover'
        } ${collapsed ? 'border border-[#9f0059] rounded-2xl py-3' : 'border-transparent'}`
      }
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </button>
  );
};

const LogoutElement = ({ label, icon, active, onClick, collapsed }: SidebarElementProperties) => {
  return (
    <button
      onClick={onClick}
      className={`sidebar-logout ${active
          ? 'sidebar-element-active'
          : 'sidebar-element-hover'
        } ${collapsed ? 'rounded-2xl' : 'rounded-4xl'}`
      }
    >
      {icon && <span className='shrink-0'>{icon}</span>}
      {!collapsed && <span className="text-sm font-medium truancate">{label}</span>}
    </button>
  );
};

const SectionHeader = ({ title, collapsed, isFirst }: { title: string; collapsed: boolean; isFirst: boolean }) => {
  if (collapsed) {
    if (isFirst) return null;

    return (
      <div className='flex items-center justify-center my-6'>
        <div className='w-6 border-t border-gray-400' />
      </div>
    );
  }

  return (
    <h3 className="sidebar-element-headers">
      {title}
    </h3>
  );
};

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarSections: SidebarSections[] = [
    {
      title: 'Menu',
      items: [
        { label: 'Dashboard', icon: <DashboardIcon width={20} height={20} />, path: '/dashboard' }
      ],
    },
    {
      title: 'Volunteers',
      items: [
        { label: 'Overview', icon: <VolunteersIcon width={20} height={20} />, path: '/volunteers/overview' },
        { label: 'Matching', icon: <MatchingIcon width={20} height={20} />, path: '/volunteers/matching' },
        { label: 'Reporting', icon: <ReportingIcon width={20} height={20} />, path: '/volunteers/reporting' }
      ],
    },
    {
      title: 'Schedules',
      items: [
        { label: 'Calendar', icon: <CalendarIcon width={20} height={20} />, path: '/calendar' }
      ],
    },
    {
      title: 'Settings',
      items: [
        { label: 'Users', icon: <UsersIcon width={20} height={20} />, path: '/settings/users' },
        { label: 'Message Templates', icon: <MessageIcon width={20} height={20} />, path: '/settings/messages' }
      ],
    },
  ];

  return (
    <aside
      className={`sidebar-background ${collapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Top-sidebar - Acara logo and name */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/acara-logo.png"
            alt="Acara logo"
            width={65}
            height={65}
          />
          {!collapsed && (
            <span className="sidebar-acara">
              Acara Hospice
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-minimize-btn"
        >
          {collapsed ? <ChevronsRight color="white" size={11} /> : <ChevronsLeft color="white" size={16} />}
        </button>
      </div>

      {/* Mid-sidebar - sections and page links */}
      <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto">
        {sidebarSections.map((section, index) => (
          <div key={section.title}>
            <SectionHeader title={section.title} collapsed={collapsed} isFirst={index === 0} />
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
          icon={<LogoutIcon width={20} height={20} />}
          active={pathname === '/login'}
          onClick={() => signOut() } //automatically redirects to login page via api/auth/[...nextauth]/routes.ts pages
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
