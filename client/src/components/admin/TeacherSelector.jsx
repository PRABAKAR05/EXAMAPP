import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, User as UserIcon, CheckCircle } from 'lucide-react';

const TeacherSelector = ({ currentTeacherId, onSelect, onCancel }) => {
    const [teachers, setTeachers] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(currentTeacherId || '');

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await api.get('/admin/users?role=teacher');
            setTeachers(res.data);
        } catch (error) {
            console.error('Failed to fetch teachers');
        }
    };

    const filteredTeachers = teachers.filter(t => 
        t.fullName.toLowerCase().includes(search.toLowerCase()) || 
        t.username.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = () => {
        if (selectedId && selectedId !== currentTeacherId) {
            if (currentTeacherId) {
                if (!window.confirm('This will replace the current teacher. Continue?')) return;
            }
            onSelect(selectedId);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assign Teacher</h3>
            
            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
                    <label 
                        key={teacher._id} 
                        className={`flex items-center p-3 rounded cursor-pointer border transition
                            ${selectedId === teacher._id 
                                ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400' 
                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <input 
                            type="radio" 
                            name="teacher" 
                            value={teacher._id} 
                            checked={selectedId === teacher._id}
                            onChange={() => setSelectedId(teacher._id)}
                            className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{teacher.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{teacher.username}</p>
                        </div>
                        {selectedId === teacher._id && <CheckCircle className="text-blue-500" size={18} />}
                    </label>
                )) : (
                    <p className="text-gray-500 text-center py-4">No teachers found.</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    disabled={!selectedId || selectedId === currentTeacherId}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    Save Selection
                </button>
            </div>
        </div>
    );
};

export default TeacherSelector;
