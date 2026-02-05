import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, UserPlus, Trash2, Edit2, UserCheck, Shield } from 'lucide-react';
import TeacherSelector from '../../components/admin/TeacherSelector';
import StudentSelector from '../../components/admin/StudentSelector';

const ClassDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [classData, setClassData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // UI Modes
    const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);
    const [isAddingStudents, setIsAddingStudents] = useState(false);

    useEffect(() => {
        fetchClassDetails();
    }, [id]);

    const fetchClassDetails = async () => {
        try {
            const res = await api.get(`/admin/classes/${id}`);
            setClassData(res.data);
        } catch (error) {
            console.error('Error fetching class details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTeacher = async (teacherId) => {
        try {
            const response = await api.patch(`/admin/classes/${id}/assign-teacher`, { teacherId });
            setIsAssigningTeacher(false);
            fetchClassDetails();
            alert(response.data.message);
        } catch (error) {
            alert('Failed to assign teacher');
        }
    };

    const handleAddStudents = async (studentIds) => {
        try {
            const response = await api.post(`/admin/classes/${id}/students/bulk`, { studentIds });
            setIsAddingStudents(false);
            fetchClassDetails();
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add students');
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!window.confirm('Remove this student from the class?')) return;
        try {
            await api.delete(`/admin/classes/${id}/students/${studentId}`);
            fetchClassDetails();
        } catch (error) {
            alert('Failed to remove student');
        }
    };

    if (loading) return <div className="p-8 text-center dark:text-white">Loading...</div>;
    if (!classData) return <div className="p-8 text-center text-red-500">Class not found</div>;

    const studentCount = classData.studentIds.length;
    const capacityPercentage = (studentCount / 50) * 100;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <button 
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary mb-6 transition"
            >
                <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & Teacher */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Class Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-t-4 border-primary">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{classData.name}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{classData.subjectCode} • {classData.batch}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                ${classData.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  classData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                {classData.status}
                            </span>
                        </div>
                        
                        {/* Capacity Meter */}
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-300 font-medium">Class Capacity</span>
                                <span className={`${studentCount >= 50 ? 'text-red-500 font-bold' : 'text-gray-900 dark:text-white'}`}>
                                    {studentCount} / 50
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ${studentCount >= 50 ? 'bg-red-600' : capacityPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                                    style={{ width: `${capacityPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <Shield size={18} className="mr-2 text-primary" /> Assigned Teacher
                            </h3>
                            {!isAssigningTeacher && classData.status !== 'archived' && (
                                <button 
                                    onClick={() => setIsAssigningTeacher(true)}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {classData.teacherId ? 'Change' : 'Assign'}
                                </button>
                            )}
                        </div>

                        {isAssigningTeacher ? (
                            <TeacherSelector 
                                currentTeacherId={classData.teacherId?._id}
                                onSelect={handleAssignTeacher}
                                onCancel={() => setIsAssigningTeacher(false)}
                            />
                        ) : (
                            classData.teacherId ? (
                                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                                        {classData.teacherId.username[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{classData.teacherId.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">@{classData.teacherId.username}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                    <p className="text-gray-500 text-sm">No teacher assigned yet.</p>
                                    <button 
                                        onClick={() => setIsAssigningTeacher(true)}
                                        className="mt-2 text-primary font-medium text-sm hover:underline"
                                    >
                                        Assign Now
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Right Column: Students */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Student List */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enrolled Students</h3>
                            {!isAddingStudents && classData.status !== 'archived' && (
                                <button 
                                    onClick={() => setIsAddingStudents(true)}
                                    disabled={studentCount >= 50}
                                    className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                                >
                                    <UserPlus size={16} className="mr-2" /> Add Students
                                </button>
                            )}
                        </div>

                        {isAddingStudents && (
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                <StudentSelector 
                                    currentlyEnrolledIds={classData.studentIds.map(s => s._id)}
                                    onAdd={handleAddStudents}
                                    onCancel={() => setIsAddingStudents(false)}
                                    maxCapacity={50}
                                />
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Username / ID</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {classData.studentIds.length > 0 ? (
                                        classData.studentIds.map(student => (
                                            <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs mr-3">
                                                            {student.username[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{student.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    @{student.username}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button 
                                                        onClick={() => handleRemoveStudent(student._id)}
                                                        className="text-gray-400 hover:text-red-600 transition"
                                                        title="Remove Student"
                                                        disabled={classData.status === 'archived'}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
                                                <p>No students enrolled yet.</p>
                                                <p className="text-sm mt-1">Click "Add Students" to enroll users.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassDetailPage;
