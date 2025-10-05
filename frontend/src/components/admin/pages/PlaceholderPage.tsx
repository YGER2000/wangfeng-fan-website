import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface PlaceholderPageProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

const PlaceholderPage = ({ title, description, actions }: PlaceholderPageProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  return (
    <div
      className={cn(
        'rounded-2xl border border-wangfeng-purple/40 p-10 text-center shadow-glow backdrop-blur-md',
        isLight ? 'bg-white/85 text-gray-700' : 'bg-black/50 text-gray-200'
      )}
    >
      <h2 className="text-2xl font-semibold text-wangfeng-purple">{title}</h2>
      <p className="mt-4 text-sm text-gray-500">{description}</p>
      {actions && <div className="mt-6 flex justify-center gap-3">{actions}</div>}
    </div>
  );
};

export default PlaceholderPage;
