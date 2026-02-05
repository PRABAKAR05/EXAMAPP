import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CreateExamPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedClassId = searchParams.get('classId');

    const [classes, setClasses] = useState([]); // Store assigned classes
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: 3, // Default: 3 Minutes
        totalMarks: 10, // Default: 10 Marks
        scheduledStart: '',
        scheduledEnd: '',
        accessType: 'private', // Always private (Class-based)
        classId: preSelectedClassId || '' 
    });
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch assigned classes
        const fetchClasses = async () => {
            try {
                const res = await api.get('/teacher/classes');
                setClasses(res.data);
                
                // Auto-select first class if not already selected and classes exist
                if (res.data.length > 0 && !formData.classId && !preSelectedClassId) {
                    setFormData(prev => ({ ...prev, classId: res.data[0]._id }));
                }
            } catch (err) {
                console.error("Failed to fetch classes");
            }
        };
        fetchClasses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/teacher/exams', formData);
            navigate(`/teacher/exams/${res.data._id}`); // Redirect to edit/add questions page
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create exam');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in-up">
            <button 
                onClick={() => navigate('/teacher/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition transform hover:-translate-x-1"
            >
                <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 border-l-4 border-primary pl-3">Create New Exam</h1>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate-bounce-short">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="transition-opacity duration-500 delay-100">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exam Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            placeholder="e.g. Mid-Term Physics Assessment"
                        />
                    </div>

                    <div className="transition-opacity duration-500 delay-200">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            placeholder="Brief details about the exam..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-500 delay-300">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Class</label>
                            <select
                                name="classId"
                                required
                                value={formData.classId}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            >
                                <option value="">-- Select a Class --</option>
                                {classes.map(cls => (
                                    <option key={cls._id} value={cls._id}>
                                        {cls.name} ({cls.subjectCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-500 delay-400">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (Minutes)</label>
                            <input
                                type="number"
                                name="duration"
                                required
                                min="1"
                                value={formData.duration}
                                onChange={(e) => {
                                    const newDuration = parseInt(e.target.value) || 0;
                                    const start = formData.scheduledStart;
                                    
                                    let newEnd = formData.scheduledEnd;
                                    if (start && newDuration > 0) {
                                        const startDate = new Date(start);
                                        const endDate = new Date(startDate.getTime() + newDuration * 60000);
                                        const tzOffset = endDate.getTimezoneOffset() * 60000;
                                        const localISOTime = (new Date(endDate - tzOffset)).toISOString().slice(0, 16);
                                        newEnd = localISOTime;
                                    }
                                    setFormData({ ...formData, duration: newDuration, scheduledEnd: newEnd });
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Marks</label>
                            <input
                                type="number"
                                name="totalMarks"
                                required
                                min="1"
                                value={formData.totalMarks}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Time</label>
                            <input
                                type="datetime-local"
                                name="scheduledStart"
                                required
                                value={formData.scheduledStart}
                                onChange={(e) => {
                                    const newStart = e.target.value;
                                    const duration = parseInt(formData.duration) || 0;
                                    
                                    let newEnd = formData.scheduledEnd;
                                    if (newStart && duration > 0) {
                                        const startDate = new Date(newStart);
                                        const endDate = new Date(startDate.getTime() + duration * 60000);
                                        const tzOffset = endDate.getTimezoneOffset() * 60000;
                                        const localISOTime = (new Date(endDate - tzOffset)).toISOString().slice(0, 16);
                                        newEnd = localISOTime;
                                    }
                                    setFormData({ ...formData, scheduledStart: newStart, scheduledEnd: newEnd });
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Time</label>
                            <input
                                type="datetime-local"
                                name="scheduledEnd"
                                required
                                value={formData.scheduledEnd}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all focus:ring-2"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-transform transform hover:scale-105 active:scale-95"
                        >
                            Create & Add Questions
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateExamPage;
