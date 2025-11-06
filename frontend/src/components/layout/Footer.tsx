import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaYoutube, FaSpotify, FaFacebookF } from 'react-icons/fa';
import { withBasePath, cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  const isLightMode = theme === 'white';

  return (
    <footer
      className={cn(
        'py-12 border-t border-wangfeng-purple/30 transition-colors duration-300',
        isLightMode ? 'bg-white text-gray-900' : 'bg-black text-white'
      )}
    >
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-3xl font-bebas tracking-wider">
                Music <span className={cn("text-wangfeng-purple", !isLightMode && "text-glow")}>King</span>
              </span>
            </Link>
            <p className={cn('mb-4 transition-colors duration-300', isLightMode ? 'text-gray-600' : 'text-gray-300')}>
              这里有关于汪峰的一切，让我们一起<span className="fan-exclamation">找点乐子吧！</span> 
            </p>
            <div className="flex space-x-4">
              <a href="https://weibo.com/wangfeng" target="_blank" rel="noopener noreferrer" className="text-wangfeng-purple hover:text-purple-400 transition-colors hover:scale-110 transform duration-300">
                <FaTwitter size={24} />
              </a>
              <a href="https://instagram.com/wangfeng" target="_blank" rel="noopener noreferrer" className="text-wangfeng-purple hover:text-purple-400 transition-colors hover:scale-110 transform duration-300">
                <FaInstagram size={24} />
              </a>
              <a href="https://youtube.com/wangfeng" target="_blank" rel="noopener noreferrer" className="text-wangfeng-purple hover:text-purple-400 transition-colors hover:scale-110 transform duration-300">
                <FaYoutube size={24} />
              </a>
              <a href="https://music.163.com/artist?id=wangfeng" target="_blank" rel="noopener noreferrer" className="text-wangfeng-purple hover:text-purple-400 transition-colors hover:scale-110 transform duration-300">
                <FaSpotify size={24} />
              </a>
              <a href="https://facebook.com/wangfeng" target="_blank" rel="noopener noreferrer" className="text-wangfeng-purple hover:text-purple-400 transition-colors hover:scale-110 transform duration-300">
                <FaFacebookF size={24} />
              </a>
            </div>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-wangfeng-purple border-b border-wangfeng-purple/30 pb-2">摇滚粉丝总部</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 关于汪峰
              </Link></li>
              <li><Link to="/tour-dates" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 行程信息
              </Link></li>
              <li><Link to="/discography" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 音乐作品 <span className="ml-2 text-xs bg-wangfeng-purple text-white px-1 rounded" style={{ animation: 'none' }}>新!</span>
              </Link></li>
              <li><Link to="/video-archive" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 视频精选
              </Link></li>
              <li><Link to="/gallery" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 图片画廊
              </Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-wangfeng-purple border-b border-wangfeng-purple/30 pb-2">汪峰世界</h3>
            <ul className="space-y-3">
              <li><Link to="/shu-ju-ke-pu" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 资料科普
              </Link></li>
              <li><Link to="/feng-yan-feng-yu" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 峰言峰语
              </Link></li>
              <li><Link to="/feng-mi-liao-feng" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 峰迷荟萃
              </Link></li>
              <li><Link to="/game-activity" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 游戏活动
              </Link></li>
              <li><Link to="/about-site" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 关于本站
              </Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-wangfeng-purple border-b border-wangfeng-purple/30 pb-2">快速链接</h3>
            <ul className="space-y-3">
              <li><a href="https://weibo.com/u/1197369013" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 汪峰微博
              </a></li>
              <li><a href="https://weibo.com/u/2726286521" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 汪峰工作室微博
              </a></li>
              <li><a href="https://blog.sina.com.cn/wangfeng" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 汪峰博客
              </a></li>
              <li><a href="https://wangfengcalendar.home.blog/" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 日历个站
              </a></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-wangfeng-purple border-b border-wangfeng-purple/30 pb-2">摇滚传奇时代！</h3>
            <div
              className={cn(
                'p-4 rounded-lg border border-wangfeng-purple/30 shadow-glow transition-colors duration-300',
                isLightMode ? 'bg-white' : 'bg-secondary-dark'
              )}
            >
              <div className="flex items-center">
                <img
                  src={withBasePath('images/album_covers/专辑封面-2025-人海.JPG')}
                  alt="人海专辑"
                  className="w-20 h-20 object-cover mr-4 border-2 border-wangfeng-purple shadow-glow"
                />
                <div>
                  <h4 className="font-bold text-wangfeng-purple text-xl">人海</h4>
                  <p className={cn('text-sm transition-colors duration-300', isLightMode ? 'text-gray-600' : 'text-gray-300')}>
                    发布: 2025年初
                  </p>
                  <div className="mt-2">
                    <a
                      href="https://music.163.com/artist?id=wangfeng"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-wangfeng-purple text-white text-sm px-3 py-1 rounded-full inline-block hover:bg-purple-700 transition-colors"
                    >
                      立即聆听
                    </a>
                  </div>
                </div>
              </div>
              <div className={cn('mt-3 text-sm italic transition-colors duration-300', isLightMode ? 'text-gray-600' : 'text-gray-300')}>
                "三十年创作生涯的深度作品!" <span className="text-wangfeng-purple font-bold">- 音乐周刊</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-wangfeng-purple/30 text-center">
          <div className="mb-4">
            <p className={cn('font-bebas tracking-wider text-xl transition-colors duration-300', isLightMode ? 'text-gray-800' : 'text-white')}>
              <span className={cn("text-wangfeng-purple", !isLightMode && "text-glow")}>信仰</span>因你而飘扬
            </p>
          </div>
          
          <div className={cn('md:flex md:justify-between text-sm transition-colors duration-300', isLightMode ? 'text-gray-500' : 'text-gray-400')}>
            <p className="mb-2 md:mb-0">
              © 2025 汪峰资料库，歌迷共创 <span className="text-wangfeng-purple">♥</span> 
            </p>
            <p>
              摇滚是一种<span className="fan-exclamation">态度</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;