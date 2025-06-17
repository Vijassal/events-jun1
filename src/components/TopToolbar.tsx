import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

interface TopToolbarProps {
  navItems: NavItem[];
  tempButtons?: { label: string; onClick?: () => void }[];
  searchButton?: { onClick?: () => void };
}

const TopToolbar: React.FC<TopToolbarProps> = ({ navItems, tempButtons = [], searchButton }) => {
  return (
    <nav className="sticky top-0 z-50 w-full flex justify-center bg-white/80 backdrop-blur-md py-3 shadow-none border-none">
      <div className="inline-flex items-center rounded-full px-4 py-2 bg-gray-100/80 gap-2 md:gap-4 w-auto mx-auto justify-center">
        {/* Navigation Items */}
        <div className="flex items-center justify-center gap-1 md:gap-2">
          {navItems.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition-colors duration-150 ${item.active ? 'bg-lime-300 text-black shadow' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {/* Temporary Buttons */}
        {tempButtons.map((btn, idx) => (
          <button
            key={btn.label + idx}
            onClick={btn.onClick}
            className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-xs md:text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            {btn.label}
          </button>
        ))}
        {/* Search Button */}
        <button
          onClick={searchButton?.onClick}
          className="ml-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
          aria-label="Search"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-600">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default TopToolbar; 