import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, UserPlus, AlertCircle } from 'lucide-react';

const StudentSelector = ({ currentlyEnrolledIds = [], onAdd, onCancel, maxCapacity = 50 }) => {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/admin/users?role=student');
            // Filter out students already enrolled in this class
            const available = res.data.filter(s => !currentlyEnrolledIds.includes(s._id));
            setStudents(available);
        } catch (error) {
            console.error('Failed to fetch students');
        }
    };

    const filteredStudents = students.filter(s => 
        s.fullName.toLowerCase().includes(search.toLowerCase()) || 
        s.username.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredStudents.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredStudents.map(s => s._id));
        }
    };

    const handleSubmit = () => {
        const remainingSpace = maxCapacity - currentlyEnrolledIds.length;
        if (selectedIds.length > remainingSpace) {
            alert(`You selected ${selectedIds.length} students, but only ${remainingSpace} spots are available.`);
            return;
        }
        onAdd(selectedIds);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex justify-between items-center">
                Add Students
                <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Selected: {selectedIds.length}
                </span>
            </h3>
            
            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search students..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            {/* List Header */}
            <div className="flex items-center mb-2 px-3">
                <input 
                    type="checkbox" 
                    checked={filteredStudents.length > 0 && selectedIds.length === filteredStudents.length}
                    onChange={handleSelectAll}
                    disabled={filteredStudents.length === 0}
                    className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">Select All in View</span>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto space-y-1 mb-4 border-t border-b dark:border-gray-700 py-2">
                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                    <label 
                        key={student._id} 
                        className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                        <input 
                            type="checkbox" 
                            name="student" 
                            value={student._id} 
                            checked={selectedIds.includes(student._id)}
                            onChange={() => handleToggle(student._id)}
                            className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{student.fullName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{student.username}</p>
                        </div>
                    </label>
                )) : (
                    <p className="text-gray-500 text-center py-4">No available students match your search.</p>
                )}
            </div>

            {/* Capacity Warning */}
            {currentlyEnrolledIds.length + selectedIds.length > maxCapacity && (
                <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-xs flex items-start">
                    <AlertCircle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                    Cannot add {selectedIds.length} students. Only {maxCapacity - currentlyEnrolledIds.length} spots left.
                </div>
            )}

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
                    disabled={selectedIds.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                    <UserPlus size={18} className="mr-2" /> Enroll Selected
                </button>
            </div>
        </div>
    );
};

export default StudentSelector;
