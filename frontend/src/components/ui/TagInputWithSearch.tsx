import { useState, useEffect, useRef } from 'react';
import { Tag, X, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export interface TagOption {
  id: number;
  name: string;
}

interface TagInputWithSearchProps {
  selectedTags: TagOption[];
  onAddTag: (tag: TagOption) => void;
  onRemoveTag: (tagId: number) => void;
  onSearchTags: (query: string) => Promise<TagOption[]>;
  onCreateTag?: (name: string) => Promise<TagOption>;
  placeholder?: string;
  className?: string;
}

const TagInputWithSearch = ({
  selectedTags,
  onAddTag,
  onRemoveTag,
  onSearchTags,
  onCreateTag,
  placeholder = '搜索或输入标签...',
  className = ''
}: TagInputWithSearchProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<TagOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (!inputValue.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await onSearchTags(inputValue);
        // 过滤掉已选中的标签
        const selectedIds = selectedTags.map(t => t.id);
        const filteredResults = results.filter(r => !selectedIds.includes(r.id));
        setSearchResults(filteredResults);
        setShowDropdown(true);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('搜索标签失败:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onSearchTags, selectedTags]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTag = (tag: TagOption) => {
    onAddTag(tag);
    setInputValue('');
    setSearchResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleCreateNewTag = async () => {
    if (!inputValue.trim() || !onCreateTag) return;

    try {
      const newTag = await onCreateTag(inputValue.trim());
      onAddTag(newTag);
      setInputValue('');
      setSearchResults([]);
      setShowDropdown(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    const totalOptions = searchResults.length + (onCreateTag && inputValue.trim() ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex < searchResults.length) {
          handleSelectTag(searchResults[highlightedIndex]);
        } else if (onCreateTag && inputValue.trim()) {
          handleCreateNewTag();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const canCreateNew = onCreateTag && inputValue.trim() &&
    !searchResults.some(r => r.name.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className={cn(
        "text-sm",
        isLight ? "text-gray-700" : "text-wangfeng-purple/80"
      )}>标签（选填）</span>

      {/* 输入框 */}
      <div className="relative">
        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
            isLight ? "text-gray-500" : "text-wangfeng-purple/60"
          )} />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowDropdown(true)}
            className={cn(
              "w-full rounded-lg border pl-10 pr-4 py-3 focus:outline-none focus:ring-1",
              isLight
                ? "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-wangfeng-purple focus:ring-wangfeng-purple"
                : "bg-black/60 border-wangfeng-purple/40 text-white placeholder:text-gray-500 focus:border-wangfeng-purple"
            )}
            placeholder={placeholder}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-wangfeng-purple border-t-transparent" />
            </div>
          )}
        </div>

        {/* 搜索结果下拉框 */}
        <AnimatePresence>
          {showDropdown && (searchResults.length > 0 || canCreateNew) && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border backdrop-blur-sm shadow-xl",
                isLight
                  ? "bg-white border-gray-300"
                  : "bg-black/95 border-wangfeng-purple/40"
              )}
            >
              {searchResults.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelectTag(tag)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors",
                    highlightedIndex === index
                      ? "bg-wangfeng-purple/20 text-wangfeng-purple"
                      : isLight
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-white hover:bg-wangfeng-purple/10"
                  )}
                >
                  <Tag className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{tag.name}</span>
                </button>
              ))}

              {canCreateNew && (
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors border-t",
                    highlightedIndex === searchResults.length
                      ? "bg-wangfeng-purple/20 text-wangfeng-purple"
                      : isLight
                      ? "border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-wangfeng-purple"
                      : "border-wangfeng-purple/20 text-wangfeng-purple/70 hover:bg-wangfeng-purple/10 hover:text-wangfeng-purple"
                  )}
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">创建新标签: {inputValue}</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          <AnimatePresence>
            {selectedTags.map((tag) => (
              <motion.span
                key={tag.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm",
                  isLight
                    ? "bg-wangfeng-purple/10 border-wangfeng-purple/30 text-wangfeng-purple"
                    : "bg-wangfeng-purple/20 border-wangfeng-purple/40 text-wangfeng-purple"
                )}
              >
                <Tag className="h-3 w-3" />
                {tag.name}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag.id)}
                  className="ml-1 hover:text-wangfeng-purple/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TagInputWithSearch;
