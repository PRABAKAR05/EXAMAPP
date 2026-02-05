import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Trash2, X } from 'lucide-react';

const AddQuestionForm = ({ examId, onQuestionAdded, onClose, remainingMarks = 10 }) => {
    const [text, setText] = useState('');
    // Smart Default: If remaining is small (< 10), suggest that. Else 1 or 2? 
    // Actually, maybe just default to 1, but if remaining is 0, what then? 
    // Let's stick to user request "make smoother". Defaulting to 1 is safe, or maybe min(remaining, 5)?
    // Let's use 1 as base, but if remaining is exact, maybe suggest it?
    // Let's default to 1 for new, but if user asked for "smoother", maybe they mean less typing.
    const [marks, setMarks] = useState(remainingMarks > 0 && remainingMarks <= 5 ? remainingMarks : 2); // Default to 2 or remaining if small
    
    const [options, setOptions] = useState([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);
    const [error, setError] = useState('');

    useEffect(() => {
        // Update default marks when remaining changes (if form matches clean state)
        if (remainingMarks > 0 && remainingMarks <= 5) {
            setMarks(remainingMarks);
        }
    }, [remainingMarks]);

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index][field] = value;
        if (field === 'isCorrect' && value === true) {
             newOptions.forEach((opt, i) => {
                 if (i !== index) opt.isCorrect = false;
             });
        }
        setOptions(newOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!text.trim()) return setError('Question text is required');
        if (options.some(opt => !opt.text.trim())) return setError('All options must have text');
        if (!options.some(opt => opt.isCorrect)) return setError('Select at least one correct option');

        try {
            await api.post(`/teacher/exams/${examId}/questions`, {
                text,
                marks,
                options
            });
            onQuestionAdded();
            // Reset form
            setText('');
            setOptions([
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]);
            setError('');
            // Focus back on text area for rapid entry?
             document.getElementById('question-text')?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add question');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border dark:border-gray-700 transition-all hover:shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                    <Plus size={20} className="mr-2 text-primary" /> Add New Question
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-transform hover:rotate-90">
                        <X size={20} />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm animate-pulse">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 group-focus-within:text-primary transition-colors">Question Text</label>
                    <textarea
                        id="question-text"
                        required
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-3 border transition-all focus:shadow-md outline-none"
                        rows="2"
                        placeholder="Enter the question here..."
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options</label>
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3 group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        checked={option.isCorrect}
                                        onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer text-primary border-gray-300 focus:ring-primary transition-transform active:scale-95"
                                        title="Mark as correct answer"
                                    />
                                    {/* Tooltip hint could go here but minimal UX is requested */}
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={option.text}
                                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    className={`flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border text-sm transition-all focus:translate-x-1 outline-none ${option.isCorrect ? 'border-green-500 ring-1 ring-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marks</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={marks}
                            onChange={(e) => setMarks(e.target.value)}
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all text-center font-bold"
                        />
                     </div>
                     <div className="text-sm text-gray-500 pt-6">
                        Remaining: <span className="font-bold">{remainingMarks}</span> (suggested: {remainingMarks > 0 && remainingMarks <= 5 ? remainingMarks : 2})
                     </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} className="mr-2" /> Add Question & Continue
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddQuestionForm;
