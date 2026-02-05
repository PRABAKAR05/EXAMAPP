import { BookOpen, Users, CheckCircle, Clock } from 'lucide-react';

const ClassStats = ({ classes }) => {
    const totalClasses = classes.length;
    const activeClasses = classes.filter(c => c.status === 'active').length;
    const draftClasses = classes.filter(c => c.status === 'draft').length;
    const archivedClasses = classes.filter(c => c.status === 'archived').length;

    const stats = [
        {
            title: 'Total Classes',
            value: totalClasses,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
        },
        {
            title: 'Active Classes',
            value: activeClasses,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-100',
        },
        {
            title: 'Draft Classes',
            value: draftClasses,
            icon: Clock,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
        },
        {
            title: 'Archived',
            value: archivedClasses,
            icon: Users, // Using Users as generic or we can use Archive icon if available
            color: 'text-gray-600',
            bg: 'bg-gray-100',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center">
                    <div className={`p-4 rounded-full mr-4 ${stat.bg}`}>
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ClassStats;
