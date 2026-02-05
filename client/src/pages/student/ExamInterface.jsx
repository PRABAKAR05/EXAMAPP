import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AlertTriangle, Clock, LogOut, CheckCircle } from 'lucide-react';

const ExamInterface = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(60); // Default to avoid 0 immediate submit
    const [answers, setAnswers] = useState({}); // { questionId: optionId }
    const [warnings, setWarnings] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    
    // Anti-cheating refs
    const isFullscreen = useRef(false);

    const handleAnswerChange = (questionId, optionId) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };



    const startExam = useCallback(async () => {
        try {
            const res = await api.post(`/student/exams/${id}/start`);
            setExam(res.data.exam);
            setSession(res.data.session);
            
            // Calculate time left (Strict Logic)
            if (res.data.session.startTime) {
                const now = new Date().getTime();
                const sessionStart = new Date(res.data.session.startTime).getTime();
                const examScheduledEnd = new Date(res.data.exam.scheduledEnd).getTime(); // Hard stop
                const durationMs = res.data.exam.duration * 60 * 1000;
                
                // Max allowed end time is the EARLIER of (Start + Duration) OR (Exam Scheduled End)
                const allowedEndTime = Math.min(sessionStart + durationMs, examScheduledEnd);
                
                const remaining = Math.max(0, allowedEndTime - now);
                setTimeLeft(Math.floor(remaining / 1000));
            }

            // Enter Fullscreen
            requestFullscreen();

        } catch (error) {
            alert(error.response?.data?.message || 'Failed to start exam');
            navigate('/student/dashboard');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const handleSubmit = useCallback(async () => {
        if (!session) return;
        
        const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
            questionId: qId,
            selectedOptionId: oId
        }));

        try {
            await api.post(`/student/sessions/${session._id}/submit`, { answers: formattedAnswers });
            alert('Exam submitted successfully!');
            // Exit fullscreen if possible
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            navigate('/student/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit exam');
        }
    }, [session, answers, navigate]);

    useEffect(() => {
        startExam();
        
        // Prevent context menu
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [startExam]);

    // State for Termination Modal
    const [showTerminatedModal, setShowTerminatedModal] = useState(false);
    const [terminationReason, setTerminationReason] = useState('');

    // Ref to track last violation time for debouncing
    const lastViolationTime = useRef(0);

    const logViolation = useCallback(async (type) => {
        if (!session || session.status !== 'in-progress') return;
        
        // DEBOUNCE LOGIC: Ignore violations that happen within 1 second of each other
        // This prevents double-counting when 'blur' and 'visibilitychange' fire simultaneously
        const now = Date.now();
        if (now - lastViolationTime.current < 1000) {
            return; 
        }
        lastViolationTime.current = now;

        try {
             const currentAnswers = Object.entries(answers).map(([qId, oId]) => ({
                questionId: qId,
                selectedOptionId: oId
             }));

             const res = await api.post(`/student/sessions/${session._id}/violation`, { 
                 type,
                 answers: currentAnswers 
             });

             if (res.data.isTerminated) {
                 setTerminationReason(res.data.message || 'Exam terminated due to multiple violations.');
                 setShowTerminatedModal(true);
                 // Exit fullscreen immediately
                 if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
             } else {
                 setWarnings(res.data.violationCount);
                 setShowWarningModal(true);
             }
        } catch (error) {
            console.error('Failed to log violation', error);
        }
    }, [session, answers]); // Removed navigate from dep array, handled in modal

    // Listeners
    useEffect(() => {
        const handleVisibilityChange = () => {
             if (document.hidden) {
                logViolation('tab_switch');
             }
        };
        
        const handleBlur = () => {
             logViolation('focus_loss');
        };

        const handleFullscreenChange = () => {
             if (!document.fullscreenElement) {
                logViolation('fullscreen_exit');
             }
        };

        // Add listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
             document.removeEventListener('visibilitychange', handleVisibilityChange);
             window.removeEventListener('blur', handleBlur);
             document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [logViolation]);

    const requestFullscreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().then(() => { isFullscreen.current = true; }).catch(() => {});
        }
    };

    // Timer Interval
    useEffect(() => {
        if (!timeLeft) return;
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, handleSubmit]);

    // Sync Exam Data (Polling for Time Extension)
    useEffect(() => {
        if (!session || session.status !== 'in-progress') return;

        const syncInterval = setInterval(async () => {
            try {
                // Re-calling start endpoint returns current exam/session state without side effects
                const res = await api.post(`/student/exams/${id}/start`);
                const latestExam = res.data.exam;
                
                // Update exam state if needed (e.g. scheduledEnd changed)
                setExam(prev => ({ ...prev, scheduledEnd: latestExam.scheduledEnd, duration: latestExam.duration }));
                
                // Recalculate time left with new data
                if (res.data.session.startTime) {
                    const now = new Date().getTime();
                    const sessionStart = new Date(res.data.session.startTime).getTime();
                    const examScheduledEnd = new Date(latestExam.scheduledEnd).getTime();
                    const durationMs = latestExam.duration * 60 * 1000;
                    
                    const allowedEndTime = Math.min(sessionStart + durationMs, examScheduledEnd);
                    const remaining = Math.max(0, allowedEndTime - now);
                    
                    // Only update valid time
                    setTimeLeft(Math.floor(remaining / 1000));
                }
            } catch (err) {
                console.error("Background sync failed", err);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(syncInterval);
    }, [id, session]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="p-8 text-center">Loading Exam Environment...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 select-none">
             {/* Warning Modal */}
             {showWarningModal && !showTerminatedModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md text-center">
                         <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Warning!</h2>
                         <p className="text-gray-700 dark:text-gray-300 mb-4">
                             Moving away from the exam screen is a violation.
                             <br/>
                             <strong>{warnings}/3 Warnings Used</strong>
                         </p>
                         <button 
                             onClick={() => { setShowWarningModal(false); requestFullscreen(); }}
                             className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
                         >
                             I Understand
                         </button>
                     </div>
                 </div>
             )}

             {/* Termination Modal */}
             {showTerminatedModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md text-center border-2 border-red-600">
                         <LogOut className="mx-auto h-16 w-16 text-red-600 mb-4" />
                         <h2 className="text-2xl font-bold text-red-600 mb-2">Exam Terminated</h2>
                         <p className="text-gray-700 dark:text-gray-300 mb-6">
                             {terminationReason}
                         </p>
                         <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded text-sm text-red-800 dark:text-red-200 mb-6">
                             Your answers have been auto-submitted.
                         </div>
                         <button 
                             onClick={() => navigate('/student/dashboard')}
                             className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 w-full"
                         >
                             Return to Dashboard
                         </button>
                     </div>
                 </div>
             )}

            {/* Header / StatusBar */}
            <div className="fixed top-0 w-full bg-white dark:bg-gray-800 shadow-md z-10 px-6 py-3 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white">{exam.title}</h1>
                    <span className="text-sm text-gray-500">Student ID: {session.studentId}</span>
                </div>
                <div className={`flex items-center text-xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    <Clock className="mr-2" /> {formatTime(timeLeft)}
                </div>
                <button 
                    onClick={handleSubmit}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium"
                >
                    Submit Exam
                </button>
            </div>

            {/* Questions Container */}
            <div className="pt-24 pb-20 max-w-4xl mx-auto px-6">
                <div className="space-y-8">
                    {exam.questions.map((q, index) => (
                        <div key={q._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                <span className="text-gray-500 mr-2">{index + 1}.</span>
                                {q.text}
                                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">
                                    {q.marks} Marks
                                </span>
                            </h3>

                            <div className="space-y-3 pl-4">
                                {q.options.map((opt) => (
                                    <label 
                                        key={opt._id} 
                                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                                            answers[q._id] === opt._id 
                                            ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${q._id}`}
                                            value={opt._id}
                                            checked={answers[q._id] === opt._id}
                                            onChange={() => handleAnswerChange(q._id, opt._id)}
                                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                        />
                                        <span className="ml-3 text-gray-700 dark:text-gray-300">{opt.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExamInterface;
