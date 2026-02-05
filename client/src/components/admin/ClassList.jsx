import { Eye, Edit, Trash2, Archive, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClassList = ({ classes, onDelete, onActivate }) => {
    const navigate = useNavigate();

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teacher</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {classes.map((cls) => {
                        const studentCount = cls.studentIds ? cls.studentIds.length : 0; // Backend populate might return objects, but length check works on array
                        const capacityPercentage = (studentCount / 50) * 100;
                        const isFull = studentCount >= 50;

                        return (
                            <tr key={cls._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{cls.name}</div>
                                    <div className="text-xs text-gray-500">{cls.batch || 'No Batch'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {cls.subjectCode}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {cls.teacherId ? cls.teacherId.fullName : <span className="text-red-500 italic">Unassigned</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap align-middle">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[100px] mb-1">
                                        <div 
                                            className={`h-2.5 rounded-full ${isFull ? 'bg-red-600' : capacityPercentage > 80 ? 'bg-yellow-400' : 'bg-green-600'}`} 
                                            style={{ width: `${capacityPercentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-500">{studentCount} / 50</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cls.status)}`}>
                                        {cls.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => navigate(`/admin/classes/${cls._id}`)}
                                        className="text-primary hover:text-blue-900 mx-2"
                                        title="View Details"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {cls.status !== 'archived' && cls.status === 'draft' && (
                                        <button 
                                            onClick={() => onActivate(cls._id)}
                                            className="text-green-600 hover:text-green-900 mx-2"
                                            title="Activate"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => onDelete(cls)}
                                        className="text-red-500 hover:text-red-700 mx-2"
                                        title="Delete Class"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ClassList;
