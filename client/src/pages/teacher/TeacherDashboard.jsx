import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ExamList from '../../components/teacher/ExamList';
import TeacherClassList from '../../components/teacher/TeacherClassList';
import TeacherClassDetail from '../../components/teacher/TeacherClassDetail';
import { LayoutDashboard, FileText, BarChart2, LogOut, BookOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '../../components/ThemeToggle';

const TeacherDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Get active tab from URL or default to 'exams'
    const activeTab = searchParams.get('tab') || 'exams';

    // Helper to update tab in URL
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
        // Clear selected class when switching main tabs if needed
        if (tab !== 'classes') {
            setSelectedClassId(null);
            setSelectedClassData(null);
        }
    };
    
    // const [activeTab, setActiveTab] = useState('exams'); // Removed
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedClassData, setSelectedClassData] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Derived state from URL
    const urlClassId = searchParams.get('classId');

    // Effect: Handle URL-driven Class Selection (Load on refresh/nav)
    useEffect(() => {
        const loadClassDetails = async () => {
            if (urlClassId) {
                try {
                    // Set ID locally
                    setSelectedClassId(urlClassId);
                    // Fetch Data if not already loaded or mismatch
                    if (!selectedClassData || selectedClassData._id !== urlClassId) {
                         const res = await import('../../api/axios').then(m => m.default.get(`/teacher/classes/${urlClassId}`));
                         setSelectedClassData(res.data);
                    }
                } catch (err) {
                    console.error("Failed to restore class view", err);
                    // If invalid ID, maybe clear param?
                    setSearchParams({ tab: 'classes' }); 
                    setSelectedClassId(null);
                }
            } else {
                // If no ID in URL, ensure we show list
                setSelectedClassId(null);
                setSelectedClassData(null);
            }
        };
        
        loadClassDetails();
    }, [urlClassId]); // Run when URL param changes

    const handleClassSelect = (classId) => {
        // Just update URL, the Effect will handle data fetching & view switch
        setSearchParams({ tab: 'classes', classId });
    };

    const handleBackToClasses = () => {
        setSearchParams({ tab: 'classes' }); // Removes classId param
    };


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg fixed h-full z-10">
                <div className="p-6 border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-primary dark:text-white">Exam Portal</h1>
                    <p className="text-xs text-gray-500 mt-1">Teacher Panel</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('classes')}
                        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'classes' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <BookOpen className="mr-3" size={20} /> My Classes
                    </button>
                    <button 
                        onClick={() => setActiveTab('exams')}
                        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'exams' ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <FileText className="mr-3" size={20} /> My Exams
                    </button>

                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t dark:border-gray-700">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut className="mr-3" size={20} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white capitalize">
                        {activeTab === 'exams' ? 'Manage Exams' : 'My Classes'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />
                        <div className="flex items-center">
                            <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">Hello, {user?.username}</span>
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {activeTab === 'classes' && (
                    selectedClassId && selectedClassData ? (
                        <TeacherClassDetail 
                            classData={selectedClassData} 
                            onBack={handleBackToClasses} 
                        />
                    ) : (
                        <TeacherClassList onSelectClass={handleClassSelect} />
                    )
                )}
                
                {activeTab === 'exams' && <ExamList />}


            </main>
        </div>
    );
};

export default TeacherDashboard;
