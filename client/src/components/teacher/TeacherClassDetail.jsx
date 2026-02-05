import { ArrowLeft, Users, Mail, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherClassDetail = ({ classData, onBack }) => {
    const navigate = useNavigate();

    const handleCreateExam = () => {
        navigate(`/teacher/exams/create?classId=${classData._id}`);
    };
    
    return (
        <div>
            <button 
                onClick={onBack}
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary mb-6 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" /> Back to My Classes
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
                <div className="p-6 border-b dark:border-gray-700 bg-primary/5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{classData.name}</h2>
                            <div className="flex items-center space-x-4">
                                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-bold">
                                    {classData.subjectCode}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                    Batch: {classData.batch}
                                </span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end space-y-3">
                            <div className="flex items-center text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                                <Users size={20} className="mr-2" />
                                <span className="font-bold text-lg">{classData.studentIds.length}</span>
                                <span className="ml-1 text-sm">Students</span>
                            </div>
                            
                            <button 
                                onClick={handleCreateExam}
                                className="flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
                            >
                                <PlusCircle size={18} className="mr-2" /> Create Class Exam
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Enrolled Students</h3>
                    
                    {classData.studentIds.length === 0 ? (
                        <p className="text-gray-500 italic">No students enrolled yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username/Roll No</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {classData.studentIds.map((student) => (
                                        <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{student.fullName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{student.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                    {student.email || 'N/A'} 
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <button className="text-primary hover:text-blue-700 flex items-center">
                                                    <Mail size={16} className="mr-1" /> Message
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherClassDetail;
