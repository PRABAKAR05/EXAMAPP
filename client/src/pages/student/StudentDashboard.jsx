import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, PlayCircle, Clock, CheckCircle, GraduationCap, CalendarDays, BookOpen, Globe, ArrowLeft, XCircle } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';

import ResultModal from '../../components/student/ResultModal'; // Import Modal

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Derived state from URL (we can't store full object in URL easily, just storing class Name)
    // Actually, StudentDashboard structure is distinct: it needs the full Class Object (with exams).
    // Let's store 'className' in URL.
    // URL param is now just 'class' name (for backward compatibility) or ID?
    // User wants "Subjects" list first.
    const urlClassName = searchParams.get('class');
    
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [viewResultId, setViewResultId] = useState(null); // State for modal
    
    // We derive 'selectedClass' from 'exams' + 'urlClassName'
    const [selectedClass, setSelectedClass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date()); // Heartbeat for UI updates

    useEffect(() => {
        const load = async () => {
            await Promise.all([fetchClasses(), fetchExams()]);
            setLoading(false); 
        };
        load();

        // Auto-refresh UI every 10 seconds to update 'Start'/'Expired' buttons
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Effect to sync URL param with local state once exams are loaded
    useEffect(() => {
        if (urlClassName && exams.length > 0) {
            // Filter exams belonging to this class name
            const classExams = exams.filter(e => e.classId && e.classId.name === urlClassName);
            
            // If we have exams, use them. If not, we might still want to show the header if we have the class detail?
            // Currently structure relies on exams existing. 
            // If user has NO exams in top 9 for this class, this view might look empty.
            // But let's respect the "Limit 9 exams" constraint globally.
            // If I click a class, I expect to see its exams. 
            // If the exams are not in the "Top 9", they won't appear here (which is what user asked for?).
            
            if (classExams.length > 0 || urlClassName) {
                 setSelectedClass({ name: urlClassName, exams: classExams });
            }
        } else if (!urlClassName) {
            setSelectedClass(null);
        }
    }, [urlClassName, exams]);

    const handleClassClick = (className) => {
        setSearchParams({ class: className });
    };

    const handleBackInfo = () => {
        setSearchParams({}); // Clear param
    };

    const fetchClasses = async () => {
        try {
            const res = await api.get('/student/classes');
            setClasses(res.data);
        } catch (error) {
            console.error('Failed to fetch classes', error);
        }
    };

    const fetchExams = async () => {
        try {
            const res = await api.get('/student/exams');
            setExams(res.data);
        } catch (error) {
            console.error('Failed to fetch exams', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleStartExam = (examId) => {
        if (confirm("Starting the exam will enter fullscreen mode. Do not switch tabs or exit fullscreen, or you will be flagged for violation.\n\nAre you sure you want to start?")) {
            navigate(`/student/exam/${examId}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold text-primary dark:text-white">Exam Portal</h1>
                </div>

                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Welcome, {user?.fullName || user.username}</span>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-800"
                    >
                        <LogOut size={16} className="mr-1" /> Logout
                    </button>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-7xl mx-auto p-8">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Subjects</h2> 

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="space-y-6">
                        {!selectedClass ? (
                            /* --- LEVEL 1: CLASS FOLDERS VIEW --- */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classes.map((cls) => (
                                    <div 
                                        key={cls._id}
                                        onClick={() => handleClassClick(cls.name)}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition p-8 cursor-pointer border-l-4 border-primary flex flex-col items-start"
                                    >
                                        <div className="bg-blue-50 dark:bg-gray-700 p-3 rounded-full mb-4 text-primary dark:text-blue-400">
                                            {cls.name === 'General / Public Exams' ? <Globe size={28} /> : <BookOpen size={28} />}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{cls.name}</h3>
                                        {/* Display badge if exams are available in the limited list OR use the backend count */}
                                        <div className="flex items-center space-x-2">
                                            {cls.examCount > 0 ? (
                                                <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                                                    {cls.examCount} Active Exam{cls.examCount !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                 <span className="text-gray-400 text-xs">No active exams</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {classes.length === 0 && (
                                    <div className="col-span-full text-center py-10 text-gray-500">
                                        No subjects enrolled.
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* --- LEVEL 2: DETAILED EXAM LIST VIEW --- */
                            <div>
                                <button 
                                    onClick={handleBackInfo}
                                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition"
                                >
                                    <ArrowLeft size={20} className="mr-2" /> Back to Classes
                                </button>

                                <div className="flex items-center space-x-3 mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedClass.name}</h2>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                                        {selectedClass.exams.length} Exams
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {selectedClass.exams.map((exam) => {
                                        const now = new Date();
                                        const start = new Date(exam.scheduledStart);
                                        const end = new Date(exam.scheduledEnd);
                                        const isBeforeStart = now < start;
                                        
                                        // Global Expiry
                                        let isExpired = now > end;

                                        // Individual Session Expiry
                                        // If student started exam, check if (startTime + duration) < now
                                        if (exam.status === 'in-progress' && exam.sessionStartTime) {
                                            const sessionStart = new Date(exam.sessionStartTime);
                                            const sessionEnd = new Date(sessionStart.getTime() + exam.duration * 60000);
                                            // Add small buffer (e.g. 1 min) for latency
                                            if (now > new Date(sessionEnd.getTime() + 60000)) {
                                                isExpired = true;
                                            }
                                        }

                                        // If expired but status is 'in-progress', treat as 'submitted' for UI purposes
                                        // effectively blocking resume.
                                        const effectiveStatus = (isExpired && exam.status === 'in-progress') ? 'submitted' : exam.status;

                                        return (
                                        <div key={exam._id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-6 relative overflow-hidden">
                                           {/* Status Badges */}
                                            {isExpired && (
                                                <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-bl font-bold">Expired</div>
                                            )}
                                            
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 mt-2">{exam.title}</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{exam.description || 'No description provided.'}</p>
                                            
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <Clock size={16} className="mr-2 text-primary" />
                                                    <span>{exam.duration} Minutes</span>
                                                </div>
                                                {/* Passing Marks removed */}
                                                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                    <CalendarDays size={16} className="mr-2 text-primary" />
                                                    <span>
                                                        {new Date(exam.scheduledStart).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {(effectiveStatus === 'submitted' || effectiveStatus === 'terminated') ? (
                                                isExpired ? (
                                                    <button 
                                                        onClick={() => setViewResultId(exam._id)}
                                                        className="w-full flex justify-center items-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                                                    >
                                                        <CheckCircle size={18} className="mr-2" /> View Result
                                                    </button>
                                                ) : (
                                                    <div className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-center text-sm border border-gray-200 dark:border-gray-600 flex justify-center items-center flex-col">
                                                        <span className="font-semibold mb-1">
                                                            {effectiveStatus === 'terminated' ? 'Exam Terminated' : 'Submitted'}
                                                        </span>
                                                        <span className="text-xs">Result available after exam ends</span>
                                                    </div>
                                                )
                                            ) : effectiveStatus === 'in-progress' ? (
                                                // Assuming not expired here because effectiveStatus handles it
                                                 <button 
                                                     onClick={() => handleStartExam(exam._id)}
                                                     className="w-full flex justify-center items-center py-2 px-4 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                                                 >
                                                     <PlayCircle size={18} className="mr-2" /> Resume Exam
                                                 </button>
                                            ) : isBeforeStart ? (
                                                <button 
                                                    disabled
                                                    className="w-full flex justify-center items-center py-2 px-4 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed border border-gray-300 dark:border-gray-600"
                                                >
                                                    <Clock size={18} className="mr-2" /> Starts {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </button>
                                            ) : isExpired ? (
                                                <button 
                                                    disabled
                                                    className="w-full flex justify-center items-center py-2 px-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md cursor-not-allowed border border-red-200 dark:border-red-800"
                                                >
                                                    <XCircle size={18} className="mr-2" /> Not Attended
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleStartExam(exam._id)}
                                                    className="w-full flex justify-center items-center py-2 px-4 bg-primary text-white rounded-md hover:bg-blue-700 transition"
                                                >
                                                    <PlayCircle size={18} className="mr-2" /> Start Exam
                                                </button>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Result Modal */}
                {viewResultId && (
                    <ResultModal 
                        examId={viewResultId} 
                        onClose={() => setViewResultId(null)} 
                    />
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;

