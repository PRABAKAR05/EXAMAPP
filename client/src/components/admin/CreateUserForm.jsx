import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus, Edit, X } from 'lucide-react';

const CreateUserForm = ({ onClose, onUserCreated, initialData = null }) => {
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'student',
        fullName: '',
        email: '',
        batch: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username || '',
                password: '', // Password not needed/shown in edit
                role: initialData.role || 'student',
                fullName: initialData.fullName || '',
                email: initialData.email || '',
                batch: initialData.batch || ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let response;
            if (isEditMode) {
                // Update existing user
                response = await api.put(`/admin/users/${initialData._id}`, formData);
                alert('User updated successfully!');
            } else {
                // Create new user
                response = await api.post('/admin/users', formData);
                alert(response.data.message);
            }
            onUserCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                        {isEditMode ? <Edit className="mr-2" size={20} /> : <UserPlus className="mr-2" size={20} />} 
                        {isEditMode ? 'Edit User Details' : 'Create New User'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                        </select>
                    </div>

                    {!isEditMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                            <input
                                type="text"
                                name="username"
                                required={!isEditMode}
                                value={formData.username}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                            placeholder="user@example.com"
                        />
                    </div>

                    {!isEditMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Initial Password</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="password"
                                    required={!isEditMode}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const length = 12;
                                        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
                                        let password = "";
                                        
                                        // Ensure standard requirements
                                        password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26)); // 1 Upper
                                        password += "abcdefghijklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 26)); // 1 Lower
                                        password += "0123456789".charAt(Math.floor(Math.random() * 10)); // 1 Number
                                        password += "!@#$%^&*()_+".charAt(Math.floor(Math.random() * 12)); // 1 Special

                                        // Fill rest
                                        for (let i = 4; i < length; i++) {
                                            password += charset.charAt(Math.floor(Math.random() * charset.length));
                                        }
                                        
                                        // Shuffle
                                        password = password.split('').sort(() => 0.5 - Math.random()).join('');
                                        
                                        setFormData(prev => ({ ...prev, password }));
                                    }}
                                    className="mt-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 text-sm whitespace-nowrap"
                                >
                                    Generate Random
                                </button>
                            </div>
                        </div>
                    )}

                    {formData.role === 'student' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch (Optional)</label>
                            <input
                                type="text"
                                name="batch"
                                value={formData.batch}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm p-2 bg-gray-50 dark:bg-gray-700 border"
                                placeholder="e.g. CS-2024"
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-700 rounded-md"
                        >
                            {isEditMode ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserForm;
