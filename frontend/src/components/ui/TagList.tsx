import { Tag as TagIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TagData } from '@/utils/api';

interface TagListProps {
  tags: TagData[];
  onClick?: (tag: TagData) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TagList = ({ tags, onClick, className = '', size = 'md' }: TagListProps) => {
  if (tags.length === 0) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag, index) => (
        <motion.button
          key={tag.id}
          type="button"
          onClick={() => onClick?.(tag)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={`inline-flex items-center gap-1 rounded-full bg-wangfeng-purple/20 border border-wangfeng-purple/40 text-wangfeng-purple transition-all ${
            onClick
              ? 'cursor-pointer hover:bg-wangfeng-purple/30 hover:scale-105 active:scale-95'
              : 'cursor-default'
          } ${sizeClasses[size]}`}
        >
          <TagIcon className={iconSizes[size]} />
          {tag.name}
        </motion.button>
      ))}
    </div>
  );
};

export default TagList;
