interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }[color];

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClasses}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{title}</p>
    </div>
  );
}
