import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { BookOpen, Users, PlusCircle } from 'lucide-react';

const TeacherClassList = ({ onSelectClass }) => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/teacher/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch classes');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-8 dark:text-white">Loading classes...</div>;

    return (
        <div>
            {/* Header removed to avoid duplication with Dashboard header */}
            
            {classes.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Classes Assigned</h3>
                    <p className="text-gray-500 dark:text-gray-400">You haven't been assigned to any classes yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls) => (
                        <div key={cls._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary overflow-hidden flex flex-col h-full">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full uppercase font-bold">
                                        {cls.subjectCode}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{cls.batch}</p>
                                
                                <div className="flex items-center text-gray-700 dark:text-gray-300 mb-4">
                                    <Users size={18} className="mr-2" />
                                    <span className="font-medium">{cls.studentCount} Students Enrolled</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex space-x-2">
                                <button 
                                    onClick={() => onSelectClass(cls._id)}
                                    className="flex-1 py-2 text-primary hover:text-blue-700 font-medium text-sm border border-primary/30 rounded hover:bg-primary/5 transition"
                                >
                                    View Details
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/teacher/exams/create?classId=${cls._id}`);
                                    }}
                                    className="flex items-center justify-center px-3 py-2 bg-primary text-white rounded hover:bg-blue-700 transition shadow-sm"
                                    title="Create Exam for this Class"
                                >
                                    <PlusCircle size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherClassList;
