import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Edit2, Shield, Trash2, Ban, CheckCircle, Plus } from 'lucide-react';
import CreateUserForm from './CreateUserForm';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRole, setFilterRole] = useState(''); // '' means all
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    const handleEditClick = (user) => {
        setUserToEdit(user);
        setShowCreateModal(true);
    };

    const handleCloseModal = () => {
        setShowCreateModal(false);
        setUserToEdit(null);
    };

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/users${filterRole ? `?role=${filterRole}` : ''}`);
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    }, [filterRole]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const toggleStatus = async (id) => {
        try {
            await api.patch(`/admin/users/${id}/toggle-status`);
            // Optimistic update or refetch
            setUsers(users.map(u => 
                u._id === id ? { ...u, isDisabled: !u.isDisabled } : u
            ));
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const response = await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            alert(response.data.message);
        } catch (error) {
            console.error('Failed to delete user', error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">User Management</h2>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} className="mr-2" /> Add User
                </button>
            </div>

            <div className="mb-4">
                <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="p-2 border rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">All Roles</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.fullName || user.username}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    @{user.username}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                              user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-green-100 text-green-800'}`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.isDisabled ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Disabled
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {user.role !== 'admin' && (
                                            <>

                                                <button 
                                                    onClick={() => handleEditClick(user)}
                                                    className="text-blue-600 hover:text-blue-900 ml-2"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button  
                                                    onClick={() => handleDelete(user._id)}
                                                    className="text-gray-600 hover:text-red-600 ml-2"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreateModal && (
                <CreateUserForm 
                    onClose={handleCloseModal} 
                    onUserCreated={fetchUsers} 
                    initialData={userToEdit}
                />
            )}
        </div>
    );
};

export default UserManagement;
