import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-sage-400/30 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-forest-950 font-semibold text-base">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="p-2 text-forest-700/60 hover:text-forest-700 hover:bg-sage-50 rounded-lg transition-colors">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-forest-700 flex items-center justify-center text-sage-50 text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-forest-800 font-medium hidden sm:block">{user?.name}</span>
        </div>
      </div>
    </header>
  );
}
