import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PhotoIcon,
  CalendarIcon,
  FolderIcon,
  UsersIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, permission: 'staff' },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon, permission: 'staff' },
  { name: 'Sales', href: '/sales', icon: CurrencyDollarIcon, permission: 'staff' },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, permission: 'staff' },
  { name: 'Gallery', href: '/gallery', icon: PhotoIcon, permission: 'staff' },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon, permission: 'staff' },
  { name: 'Projects', href: '/projects', icon: FolderIcon, permission: 'staff' },
  { name: 'Users', href: '/users', icon: UsersIcon, permission: 'admin' },
  { name: 'Invite User', href: '/invite', icon: UserPlusIcon, permission: 'admin' },
];

const Sidebar = ({ onCloseSidebar }) => {
  const { user, hasPermission } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.permission)
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and close button */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AH</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              Amantena Highway
            </h1>
            <p className="text-xs text-gray-500">Farms Management</p>
          </div>
        </div>
        {onCloseSidebar && (
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={onCloseSidebar}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
              onClick={onCloseSidebar}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
