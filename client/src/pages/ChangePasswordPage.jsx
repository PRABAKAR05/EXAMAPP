import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';

const ChangePasswordPage = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { user } = useAuth(); // Re-login strictly not needed if we just update token, but simpler to redirect
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });
            setSuccess('Password changed successfully. Redirecting...');
            
            // Allow a moment for user to see success
            setTimeout(() => {
                // Determine dashboard based on role
                const dashboardPath = `/${user.role}/dashboard`;
                // Manually update user state in local storage or context if needed to clear isFirstLogin
                // Ideally, backend returns new token or user object. 
                // For now, we assume token is still valid. 
                // We should update the context "user" object's isFirstLogin to false.
                // But re-login or page refresh might be needed to sync strictly? 
                // Let's just navigate. The backend won't enforce isFirstLogin on other routes unless we middleware it.
                // But the UI redirection in Login handled it.
                navigate(dashboardPath);
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Change Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        For security, please change your password on first login.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-500 bg-red-100 rounded border border-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm text-green-500 bg-green-100 rounded border border-green-400">
                            {success}
                        </div>
                    )}
                    <div className="rounded-md shadow-sm space-y-4">
                        <div className="relative">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Password</label>
                           <div className="mt-1 relative rounded-md shadow-sm">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                           </div>
                        </div>
                        <div className="relative">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                           <div className="mt-1 relative rounded-md shadow-sm">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                           </div>
                        </div>
                         <div className="relative">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                           <div className="mt-1 relative rounded-md shadow-sm">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                           </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
