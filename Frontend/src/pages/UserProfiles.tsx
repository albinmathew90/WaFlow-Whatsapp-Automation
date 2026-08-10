import { useState } from "react";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import ChangePasswordTab from "../components/UserProfile/ChangePasswordTab";
import DeleteAccountTab from "../components/UserProfile/DeleteAccountTab";

type TabOption = 'profile' | 'password' | 'delete';

export default function UserProfiles() {
  const [activeTab, setActiveTab] = useState<TabOption>('profile');

  return (
    <>
      <div className="mb-6 flex gap-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors ${
            activeTab === 'profile'
              ? 'border-b-2 border-brand-500 text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.93 6 15.5 7.57 15.5 9.5C15.5 11.43 13.93 13 12 13C10.07 13 8.5 11.43 8.5 9.5C8.5 7.57 10.07 6 12 6ZM12 20C9.97 20 7.57 19.18 5.86 17.12C7.55 15.8 9.68 15 12 15C14.32 15 16.45 15.8 18.14 17.12C16.43 19.18 14.03 20 12 20Z" />
          </svg>
          Profile
        </button>

        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors ${
            activeTab === 'password'
              ? 'border-b-2 border-brand-500 text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17Z" />
          </svg>
          Password
        </button>

        <button
          onClick={() => setActiveTab('delete')}
          className={`flex items-center gap-2 pb-3 font-medium text-sm transition-colors ${
            activeTab === 'delete'
              ? 'border-b-2 border-brand-500 text-gray-900 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" />
          </svg>
          Delete Account
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        {activeTab === 'profile' && (
          <>
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
              Profile Settings
            </h3>
            <div className="space-y-6">
              <UserMetaCard />
              <UserInfoCard />
              <UserAddressCard />
            </div>
          </>
        )}

        {activeTab === 'password' && <ChangePasswordTab />}
        
        {activeTab === 'delete' && <DeleteAccountTab />}
      </div>
    </>
  );
}
