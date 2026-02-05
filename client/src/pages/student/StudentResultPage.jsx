import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { CheckCircle, XCircle, ArrowLeft, Award } from 'lucide-react';

const StudentResultPage = () => {
    const { id } = useParams(); // Exam ID
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/student/exams/${id}/result`);
                setResult(res.data);
            } catch (error) {
                console.error('Failed to fetch result', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (!result) return <div>Result not found</div>;

    const { examId: exam, score, status, startTime, endTime } = result;
    const isPassed = score >= exam.passingMarks;
    const percentage = ((score / exam.totalMarks) * 100).toFixed(1);

    const handleBack = () => {
        if (result?.examId?.classId?.name) {
            navigate(`/student/dashboard?class=${encodeURIComponent(result.examId.classId.name)}`);
        } else {
            navigate('/student/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 flex items-start justify-center overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-8 text-center relative mt-10">
                 <button 
                    onClick={handleBack}
                    className="absolute top-4 left-4 text-gray-500 hover:text-primary transition"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="mb-6 flex justify-center">
                    {isPassed ? (
                        <div className="bg-green-100 p-4 rounded-full">
                            <Award className="h-16 w-16 text-green-600" />
                        </div>
                    ) : (
                        <div className="bg-red-100 p-4 rounded-full">
                            <XCircle className="h-16 w-16 text-red-600" />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{exam.title}</h1>
                {status === 'terminated' && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-red-200 dark:text-red-900 mb-2 inline-block">
                        Terminated for Violations
                    </span>
                )}
                <p className="text-gray-500 dark:text-gray-400 mb-6">Result Summary</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                        <p className="text-2xl font-bold text-primary dark:text-white">{score} / {exam.totalMarks}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
                        <p className="text-2xl font-bold text-primary dark:text-white">{percentage}%</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Time Taken</p>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                           {(() => {
                               if (!endTime) return 'N/A';
                               const diff = new Date(endTime) - new Date(startTime);
                               const hrs = Math.floor(diff / 3600000);
                               const mins = Math.floor((diff % 3600000) / 60000);
                               const secs = Math.floor((diff % 60000) / 1000);
                               
                               if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
                               return `${mins}m ${secs}s`;
                           })()}
                        </p>
                    </div>
                </div>

                {/* Detailed Question Review */}
                <div className="text-left space-y-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white border-b pb-2 dark:border-gray-700">Detailed Review</h2>
                    {exam.questions.map((q, index) => {
                        const studentAnswer = result.answers.find(a => a.questionId === q._id);
                        const selectedOptionId = studentAnswer?.selectedOptionId;
                        const correctOption = q.options.find(opt => opt.isCorrect);
                        const isCorrect = selectedOptionId === correctOption._id;

                        return (
                            <div key={q._id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                        <span className="mr-2">{index + 1}.</span>{q.text}
                                    </h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                        {isCorrect ? `+${q.marks}` : '0'} Marks
                                    </span>
                                </div>
                                <div className="space-y-2 pl-4 text-sm">
                                    {q.options.map(opt => {
                                        const isSelected = selectedOptionId === opt._id;
                                        const isAnswer = opt.isCorrect;
                                        let optionClass = "text-gray-600 dark:text-gray-300";
                                        
                                        if (isAnswer) optionClass = "text-green-700 dark:text-green-400 font-bold";
                                        if (isSelected && !isAnswer) optionClass = "text-red-600 dark:text-red-400 line-through";

                                        return (
                                            <div key={opt._id} className="flex items-center">
                                                <div className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${
                                                    isAnswer ? 'border-green-500 bg-green-500' : 
                                                    (isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300')
                                                }`}>
                                                    {(isAnswer || isSelected) && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <span className={optionClass}>{opt.text}</span>
                                                {isAnswer && <span className="ml-2 text-xs text-green-600 font-bold">(Correct Answer)</span>}
                                                {isSelected && !isAnswer && <span className="ml-2 text-xs text-red-600 font-bold">(Your Answer)</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button 
                    onClick={handleBack}
                    className="w-full py-3 bg-primary text-white rounded-md font-bold hover:bg-blue-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default StudentResultPage;
