import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ResultModal = ({ examId, onClose }) => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await api.get(`/student/exams/${examId}/result`);
                setResult(res.data);
            } catch (error) {
                console.error('Failed to fetch result', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [examId]);

    if (loading) return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        </div>
    );

    if (!result) return null;

    const { examId: exam, score, startTime, endTime } = result;
    const percentage = ((score / exam.totalMarks) * 100).toFixed(1);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{exam.title}</h1>
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
                </div>
            </div>
        </div>
    );
};

export default ResultModal;
