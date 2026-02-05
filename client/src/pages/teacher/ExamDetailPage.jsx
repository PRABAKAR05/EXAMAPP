import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import AddQuestionForm from '../../components/teacher/AddQuestionForm';
import { ArrowLeft, Clock, Calendar, CheckCircle } from 'lucide-react';

const ExamDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchExam = useCallback(async () => {
        try {
            const res = await api.get(`/teacher/exams/${id}`);
            setExam(res.data);
        } catch (error) {
            console.error('Failed to fetch exam', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchExam();
    }, [fetchExam]);

    const togglePublish = async () => {
        try {
            const res = await api.patch(`/teacher/exams/${id}/publish`);
            setExam(prev => ({ ...prev, isActive: res.data.isActive }));
            alert(res.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to toggle publish status');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!exam) return <div>Exam not found</div>;

    const getStatus = () => {
        if (!exam.isActive) return { label: 'Draft', color: 'bg-yellow-100 text-yellow-800' };
        const now = new Date();
        const start = new Date(exam.scheduledStart);
        const end = new Date(exam.scheduledEnd);
        
        if (now > end) return { label: 'Completed', color: 'bg-purple-100 text-purple-800' };
        if (now >= start) return { label: 'In Progress', color: 'bg-blue-100 text-blue-800 animate-pulse' };
        return { label: 'Scheduled', color: 'bg-green-100 text-green-800' };
    };

    const statusObj = getStatus();
    const isLocked = exam.isActive && (statusObj.label === 'In Progress' || statusObj.label === 'Completed');
    
    // Safety calculations
    const questions = exam.questions || [];
    const currentMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const totalMarks = exam.totalMarks || 0;

    return (
        <div className="max-w-6xl mx-auto p-6 min-h-screen">
            <button 
                onClick={() => navigate('/teacher/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition"
            >
                <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Exam Details & Questions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
                            <span className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusObj.color}`}>
                                {exam.isActive && statusObj.label === 'Scheduled' ? <CheckCircle size={16} className="mr-1" /> : null}
                                {statusObj.label}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{exam.description}</p>
                        
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center">
                                <Clock size={16} className="mr-1" /> {exam.duration} mins
                            </div>
                            <div className="flex items-center">
                                <Calendar size={16} className="mr-1" /> {new Date(exam.scheduledStart).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Questions ({questions.length})</h2>
                            <div className="flex flex-col items-end w-1/2">
                                <div className="flex justify-between w-full mb-1">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Marks</span>
                                    <span className={`text-sm font-bold ${
                                        currentMarks === totalMarks 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                        {currentMarks} / {totalMarks}
                                    </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${
                                            currentMarks > totalMarks ? 'bg-red-500' :
                                            currentMarks === totalMarks ? 'bg-green-500' : 'bg-primary'
                                        }`} 
                                        style={{ width: `${Math.min(100, (currentMarks / (totalMarks || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                                {currentMarks !== totalMarks && (
                                    <span className="text-xs text-red-500 mt-1">Must match exactly to publish</span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {questions.map((q, index) => (
                                <div key={q._id || index} className="border dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30 animate-fade-in-up transition-all hover:shadow-md" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex justify-between">
                                        <h4 className="font-medium text-gray-900 dark:text-white">Q{index + 1}. {q.text}</h4>
                                        <span className="text-xs font-semibold bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded h-fit">{q.marks} Marks</span>
                                    </div>
                                    <ul className="mt-2 space-y-1 ml-4 list-disc text-sm text-gray-600 dark:text-gray-300">
                                        {q.options?.map((opt, i) => (
                                            <li key={i} className={opt.isCorrect ? 'text-green-600 font-medium' : ''}>
                                                {opt.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                            {questions.length === 0 && (
                                <p className="text-gray-500 text-center py-4 italic">No questions added yet. Start adding below!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Add Question */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Actions</h3>
                        
                        {statusObj.label === 'Completed' ? (
                            <button 
                                onClick={() => navigate(`/teacher/exams/${id}/results`)}
                                className="w-full py-2 px-4 rounded-md font-medium text-white bg-purple-600 hover:bg-purple-700 transition"
                            >
                                View Results
                            </button>
                        ) : (
                            <>
                            {!exam.isActive && (
                                <button 
                                    onClick={togglePublish}
                                    disabled={
                                        questions.length === 0 || 
                                        currentMarks !== totalMarks
                                    }
                                    className="w-full py-2 px-4 rounded-md font-medium text-white transition bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Publish Exam
                                </button>
                            )}
                            {exam.isActive && (
                                <>
                                <div className="w-full py-2 px-4 rounded-md font-medium text-center text-green-700 bg-green-100 border border-green-200 mb-2">
                                    Exam Published
                                </div>
                                <button 
                                    onClick={async () => {
                                        const mins = prompt("Enter extra minutes to extend (e.g. 5):");
                                        const val = parseInt(mins);
                                        if (val > 0) {
                                            try {
                                                const res = await api.patch(`/teacher/exams/${id}/extend`, { extraMinutes: val });
                                                alert(res.data.message);
                                                fetchExam(); // Refresh data
                                            } catch (err) {
                                                alert(err.response?.data?.message || "Failed to extend time");
                                            }
                                        }
                                    }}
                                    className="w-full py-2 px-4 rounded-md font-medium text-white bg-blue-500 hover:bg-blue-600 transition"
                                >
                                    <Clock size={16} className="inline mr-1" /> Extend Time
                                </button>
                                </>
                            )}
                            
                            {questions.length === 0 && (
                                <p className="text-xs text-red-500 mt-2 text-center">Add questions to publish</p>
                            )}
                            </>
                        )}
                    </div>

                    {!isLocked && statusObj.label !== 'Completed' && (
                         <AddQuestionForm 
                            examId={id} 
                            onQuestionAdded={fetchExam} 
                            remainingMarks={totalMarks - currentMarks}
                         />
                    )}
                    {isLocked && (
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                            Editing disabled because exam is {statusObj.label}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExamDetailPage;
