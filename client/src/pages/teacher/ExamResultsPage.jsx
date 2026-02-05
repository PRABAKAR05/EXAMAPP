import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Download, FileText } from 'lucide-react';

const ExamResultsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get(`/teacher/exams/${id}/results`);
                setResults(res.data);
            } catch (error) {
                console.error('Failed to fetch results', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [id]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-6xl mx-auto p-8">
            <button 
                onClick={() => navigate('/teacher/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition"
            >
                <ArrowLeft size={18} className="mr-1" /> Back to Dashboard
            </button>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Results</h1>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
                    <Download size={18} className="mr-2" /> Export CSV
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Batch</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Violations</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {results.map((result) => (
                            <tr key={result._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{result.studentId?.fullName}</div>
                                    <div className="text-sm text-gray-500">@{result.studentId?.username}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {result.studentId?.batch || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-bold text-primary dark:text-white">{result.score}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        result.violationCount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {result.violationCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        result.status === 'submitted' ? 'bg-green-100 text-green-800' : 
                                        result.status === 'terminated' ? 'bg-red-100 text-red-800' : 
                                        result.status === 'Not Attended' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {result.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {result.endTime || result.startTime ? new Date(result.endTime || result.startTime).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                        {results.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No results found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExamResultsPage;
