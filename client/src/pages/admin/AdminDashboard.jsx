import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import UserManagement from '../../components/admin/UserManagement';
import ClassManagementPage from './ClassManagementPage';
import { LayoutDashboard, Users, Settings, LogOut, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('classes');


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full">
                <div className="p-6 border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-primary dark:text-white">Exam Portal</h1>
                    <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">

                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'classes' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <LayoutDashboard className="mr-3" size={20} /> Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'users' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <Users className="mr-3" size={20} /> User Management
                    </button>
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <Settings className="mr-3" size={20} /> Settings
                    </button>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t dark:border-gray-700">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="mr-3" size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">


                <div className="mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                        {activeTab.replace('-', ' ')}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />
                        <div className="flex items-center">
                            <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Welcome, {user?.username}</span>
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>



                {activeTab === 'classes' && <ClassManagementPage />}

                {activeTab === 'users' && <UserManagement />}

                {activeTab === 'settings' && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                         <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Settings</h3>
                         <p className="text-gray-600 dark:text-gray-400">System-wide configurations will go here.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
