import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Play, Pause, Eye, FileText, Calendar, BarChart2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/teacher/exams');
            setExams(res.data);
        } catch (error) {
            console.error('Failed to fetch exams', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (id) => {
        try {
            const res = await api.patch(`/teacher/exams/${id}/publish`);
            setExams(exams.map(exam => 
                exam._id === id ? { ...exam, isActive: res.data.isActive } : exam
            ));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to toggle publish status');
        }
    };

    const deleteExam = async (id, scheduledStart) => {
        // Frontend Check for immediate feedback
        const now = new Date();
        const startTime = new Date(scheduledStart);
        const timeDiff = startTime - now; 
        const ONE_MINUTE = 60 * 1000;

        if (timeDiff < ONE_MINUTE && timeDiff > -99999999) { // Simple check, backend handles strictness. Negative diff means already started.
             // We allow deleting if it's way in past? No, backend says 'isActive & < 1min'. 
             // If isActive is false (Draft), we can always delete.
             // If isActive is true, we check time.
             const exam = exams.find(e => e._id === id);
             if (exam && exam.isActive) {
                 if (!confirm("Warning: You are deleting an Active exam close to or after open time. Proceed?")) return;
             }
        }

        if(!confirm("Are you sure you want to delete this exam?")) return;

        try {
            await api.delete(`/teacher/exams/${id}`);
            setExams(exams.filter(exam => exam._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete exam');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Exams</h2>
                <button 
                    onClick={() => navigate('/teacher/exams/create')}
                    className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} className="mr-2" /> Create Exam
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.map((exam) => {
                    // Helper to determine status
                    const now = new Date();
                    const start = new Date(exam.scheduledStart);
                    const end = new Date(exam.scheduledEnd);
                    
                    let status = 'Draft';
                    let statusColor = 'bg-gray-100 text-gray-800';

                    if (exam.isActive) {
                        if (now > end) {
                            status = 'Completed';
                            statusColor = 'bg-purple-100 text-purple-800';
                        } else if (now >= start) {
                            status = 'In Progress';
                            statusColor = 'bg-blue-100 text-blue-800 animate-pulse';
                        } else {
                            status = 'Scheduled'; // Active but future
                            statusColor = 'bg-green-100 text-green-800';
                        }
                    } else {
                         statusColor = 'bg-yellow-100 text-yellow-800';
                    }

                    // Strict Rule: Once Published & Started (or expired), NO Unpublish/Delete
                    // User Request: "once exam published then you dont unpushilsh"
                    // Refinment: Prevent Unpublish/Delete if In Progress or Completed.
                    const isLocked = exam.isActive && (status === 'In Progress' || status === 'Completed');

                    return (
                    <div key={exam._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1" title={exam.title}>
                                    {exam.title}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                    {status}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[3rem]">
                                {exam.description || 'No description provided'}
                            </p>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-2 text-primary" />
                                    <span>{start.toLocaleDateString()} {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className="flex items-center">
                                    <FileText size={16} className="mr-2 text-primary" />
                                    <span>{exam.questions.length} Questions ({exam.totalMarks} Marks)</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t dark:border-gray-700 flex justify-between items-center">
                            {/* Actions Logic:
                                - View/Edit: Allowed unless Completed? User says "exam complted only view results". 
                                  So if Completed, maybe redirect to Results directly or Read-only view. 
                                  For now, we keep View but maybe View-Only mode if we had one.
                                - Results: Always allowed.
                                - Publish/Unpublish: Disabled if Locked.
                                - Delete: Disabled if Locked.
                             */}
                            
                            {status === 'Completed' ? (
                                <button 
                                    onClick={() => navigate(`/teacher/exams/${exam._id}/results`)} // Direct to results
                                    className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center w-full justify-center"
                                >
                                    <BarChart2 size={16} className="mr-2" /> View Results
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => navigate(`/teacher/exams/${exam._id}`)}
                                        className={`text-primary hover:text-blue-700 text-sm font-medium flex items-center ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isLocked}
                                        title={isLocked ? "Cannot edit active/completed exam" : "Edit Exam"}
                                    >
                                        <Eye size={16} className="mr-1" /> {status === 'In Progress' ? 'View' : 'Edit'}
                                    </button>
                                    
                                    <button 
                                        onClick={() => navigate(`/teacher/exams/${exam._id}/results`)}
                                        className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center"
                                    >
                                        <BarChart2 size={16} className="mr-1" /> Results
                                    </button>
                                    
                                    {!exam.isActive && (
                                    <button 
                                        onClick={() => togglePublish(exam._id)}
                                        className="flex items-center text-sm font-medium text-green-500 hover:text-green-700"
                                    >
                                        <Play size={16} className="mr-1" /> Publish
                                    </button>
                                    )}
        
                                     <button 
                                        onClick={() => deleteExam(exam._id, exam.scheduledStart)}
                                        className={`text-red-500 hover:text-red-700 text-sm font-medium flex items-center ml-4 ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                                        title={isLocked ? "Cannot delete active/completed exam" : "Delete Exam"}
                                        disabled={isLocked}
                                    >
                                        <Trash2 size={16} className="mr-1" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );})}

                {exams.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No exams created</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new exam.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamList;
