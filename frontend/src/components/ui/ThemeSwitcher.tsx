import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { ThemeType, themes, themeStorage } from '@/utils/themes';

interface ThemeSwitcherProps {
  currentTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

const ThemeSwitcher = ({ currentTheme, onThemeChange }: ThemeSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: ThemeType) => {
    onThemeChange(themeId);
    themeStorage.set(themeId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* 主题切换按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-black/70 backdrop-blur-md border-2 border-wangfeng-purple text-wangfeng-purple p-3 rounded-full shadow-lg hover:bg-wangfeng-purple hover:text-white transition-all duration-300"
        title="切换背景主题"
      >
        <Palette className="w-6 h-6" />
      </motion.button>

      {/* 主题选择面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 left-0 bg-black/90 backdrop-blur-md border border-wangfeng-purple/50 rounded-xl p-4 shadow-xl min-w-64"
          >
            <h3 className="text-white font-semibold mb-3 text-sm">选择背景主题</h3>
            
            <div className="space-y-2">
              {themes.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                    currentTheme === theme.id
                      ? 'bg-wangfeng-purple text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          currentTheme === theme.id 
                            ? 'border-white bg-white' 
                            : 'border-gray-400 group-hover:border-white'
                        }`}>
                          {currentTheme === theme.id && (
                            <Check className="w-2.5 h-2.5 text-wangfeng-purple" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{theme.name}</span>
                      </div>
                      <p className={`text-xs mt-1 ml-7 ${
                        currentTheme === theme.id 
                          ? 'text-white/80' 
                          : 'text-gray-400 group-hover:text-gray-300'
                      }`}>
                        {theme.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 text-center">
                💡 主题会自动保存到本地存储
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 背景遮罩 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitcher;