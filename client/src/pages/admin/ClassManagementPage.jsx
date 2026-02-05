import { useState, useEffect } from 'react';
import api from '../../api/axios';
import ClassStats from '../../components/admin/ClassStats';
import ClassList from '../../components/admin/ClassList';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClassManagementPage = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create Form State
    const [formData, setFormData] = useState({
        name: '',
        subjectCode: '',
        batch: ''
    });

    const fetchClasses = async () => {
        try {
            const res = await api.get('/admin/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/classes', formData);
            setShowCreateModal(false);
            setFormData({ name: '', subjectCode: '', batch: '' });
            fetchClasses(); // Refresh list
        } catch (error) {
            alert('Failed to create class');
        }
    };

    const [classToDelete, setClassToDelete] = useState(null);
    const [deleteInput, setDeleteInput] = useState('');

    const handleArchive = (cls) => {
        // Renamed to handleArchive for now, but UI logic is 'Delete'
        // Keeping this prop name in ClassList might be confusing, but let's fix the handler logic
        // Actually, let's just use a new function triggered by the prop
    };

    const handleDeleteRequest = (cls) => {
        setClassToDelete(cls);
        setDeleteInput('');
    };

    const handleDeleteConfirm = async () => {
        if (deleteInput !== classToDelete.name) return;
        
        try {
            await api.delete(`/admin/classes/${classToDelete._id}`);
            fetchClasses();
            setClassToDelete(null);
            setDeleteInput('');
        } catch (error) {
            alert('Failed to delete class');
        }
    };

    const handleActivate = async (id) => {
        try {
            await api.patch(`/admin/classes/${id}/status`, { status: 'active' });
            fetchClasses();
        } catch (error) {
            alert('Failed to activate class');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Class Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage subject-based classes and assignments</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
                >
                    <Plus size={20} className="mr-2" /> Create New Class
                </button>
            </div>

            <ClassStats classes={classes} />
            <ClassList classes={classes} onDelete={handleDeleteRequest} onActivate={handleActivate} />

            {/* Create Class Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Class</h2>
                        <form onSubmit={handleCreateClass}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Data Structures"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Code</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.subjectCode}
                                    onChange={(e) => setFormData({...formData, subjectCode: e.target.value})}
                                    placeholder="e.g. CS102"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch / Semester</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.batch}
                                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                                    placeholder="e.g. 2024 - Sem 3"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
                                >
                                    Create Class
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {classToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Delete Class?</h2>
                        
                        <div className="mb-4 text-gray-600 dark:text-gray-300">
                            <p className="mb-2">Are you sure you want to delete <span className="font-bold">{classToDelete.name}</span>?</p>
                            <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900">
                                Warning: This action is permanent and cannot be undone. All data related to this class will be lost.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type <span className="font-mono font-bold select-all">{classToDelete.name}</span> to confirm
                            </label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:border-red-500 focus:ring-red-500"
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                placeholder="Type subject name here"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => {
                                    setClassToDelete(null);
                                    setDeleteInput('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleDeleteConfirm}
                                disabled={deleteInput !== classToDelete.name}
                                className={`px-4 py-2 rounded text-white font-bold transition ${
                                    deleteInput === classToDelete.name 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-md' 
                                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                                }`}
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassManagementPage;
