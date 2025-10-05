import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Check } from 'lucide-react';
import { ColorTheme, colorThemes, colorThemeStorage } from '@/utils/themes';

interface ColorThemeSwitcherProps {
  currentTheme: ColorTheme;
  onThemeChange: (theme: ColorTheme) => void;
}

const ColorThemeSwitcher = ({ currentTheme, onThemeChange }: ColorThemeSwitcherProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeSelect = (themeId: ColorTheme) => {
    onThemeChange(themeId);
    colorThemeStorage.set(themeId);
    setIsOpen(false);
  };

  // 快速切换功能
  const handleQuickToggle = () => {
    const newTheme = currentTheme === 'starry-fantasy' ? 'white' : 'starry-fantasy';
    handleThemeSelect(newTheme);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 快速切换按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleQuickToggle}
        className={`${
          currentTheme === 'starry-fantasy'
            ? 'bg-black/70 backdrop-blur-md border-2 border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
            : 'bg-white/70 backdrop-blur-md border-2 border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
        } p-3 rounded-full shadow-lg transition-all duration-300 mr-2`}
        title={`切换到${currentTheme === 'starry-fantasy' ? '白色' : '星空幻想'}主题`}
      >
        {currentTheme === 'starry-fantasy' ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </motion.button>

      {/* 详细选择按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          currentTheme === 'starry-fantasy'
            ? 'bg-black/70 backdrop-blur-md border-2 border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
            : 'bg-white/70 backdrop-blur-md border-2 border-wangfeng-purple text-wangfeng-purple hover:bg-wangfeng-purple hover:text-white'
        } p-3 rounded-full shadow-lg transition-all duration-300`}
        title="主题设置"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      </motion.button>

      {/* 主题选择面板 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-16 right-0 ${
              currentTheme === 'starry-fantasy'
                ? 'bg-black/90 backdrop-blur-md border border-wangfeng-purple/50'
                : 'bg-white/90 backdrop-blur-md border border-wangfeng-purple/50'
            } rounded-xl p-4 shadow-xl min-w-64`}
          >
            <h3 className={`${
              currentTheme === 'starry-fantasy' ? 'text-white' : 'text-black'
            } font-semibold mb-3 text-sm`}>选择颜色主题</h3>
            
            <div className="space-y-2">
              {colorThemes.map((theme) => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                    currentTheme === theme.id
                      ? 'bg-wangfeng-purple text-white'
                      : currentTheme === 'starry-fantasy'
                      ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      : 'bg-gray-200/50 text-gray-700 hover:bg-gray-300/50 hover:text-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          currentTheme === theme.id 
                            ? 'border-white bg-white' 
                            : currentTheme === 'starry-fantasy'
                            ? 'border-gray-400 group-hover:border-white'
                            : 'border-gray-600 group-hover:border-black'
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
                          : currentTheme === 'starry-fantasy'
                          ? 'text-gray-400 group-hover:text-gray-300'
                          : 'text-gray-500 group-hover:text-gray-600'
                      }`}>
                        {theme.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className={`mt-3 pt-3 border-t ${
              currentTheme === 'starry-fantasy' ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <p className={`text-xs text-center ${
                currentTheme === 'starry-fantasy' ? 'text-gray-400' : 'text-gray-500'
              }`}>
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

export default ColorThemeSwitcher;