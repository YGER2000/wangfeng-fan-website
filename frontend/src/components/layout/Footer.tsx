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
        {/* Fan Quote Banner */}
        <div
          className={cn(
            'mb-12 py-6 px-4 rounded-xl border border-wangfeng-purple shadow-glow relative overflow-hidden transition-colors duration-300',
            isLightMode ? 'bg-white' : 'bg-secondary-dark'
          )}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-wangfeng-purple/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-wangfeng-purple/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <p
            className={cn(
              'font-serif italic text-lg md:text-2xl text-center relative z-10 transition-colors duration-300',
              isLightMode ? 'text-gray-700' : 'text-white'
            )}
          >
            <span className="text-wangfeng-purple font-bold">"</span>
            真正重要的自由，是可以在必须说不的时候可以说是，可以在所有人都说是的时候说不
            <span className="text-wangfeng-purple font-bold">"</span>
          </p>
          <p
            className={cn(
              'text-center text-sm mt-2 font-bebas tracking-wider transition-colors duration-300',
              isLightMode ? 'text-purple-500' : 'text-purple-300'
            )}
          >
            - 汪峰
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-3xl font-bebas tracking-wider">
                Music <span className="text-wangfeng-purple text-glow">King</span>
              </span>
            </Link>
            <p className={cn('mb-4 transition-colors duration-300', isLightMode ? 'text-gray-600' : 'text-gray-300')}>
              终极粉丝网站，展示我们的灵魂歌者！ <span className="fan-exclamation">燃爆</span> 自1994!
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
              <li><Link to="/discography" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 音乐作品 <span className="ml-2 text-xs bg-wangfeng-purple text-white px-1 rounded" style={{ animation: 'none' }}>新!</span>
              </Link></li>
              <li><Link to="/tour-dates" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 摇滚传奇巡演
              </Link></li>
              <li><Link to="/gallery" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 图库
              </Link></li>
              <li><Link to="/awards" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 奖项与成就
              </Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 uppercase tracking-wider text-wangfeng-purple border-b border-wangfeng-purple/30 pb-2">汪峰世界</h3>
            <ul className="space-y-3">
              <li><Link to="/news" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 新闻资讯
              </Link></li>
              <li><Link to="/acting-career" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 影视生涯
              </Link></li>
              <li><Link to="/quotes" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 经典语录
              </Link></li>
              <li><a href="https://www.wangfeng.com" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 官方网站
              </a></li>
              <li><a href="https://shop.wangfeng.com" target="_blank" rel="noopener noreferrer" className={cn('hover:text-wangfeng-purple transition-colors flex items-center', isLightMode ? 'text-gray-600' : 'text-gray-200')}>
                <span className="text-wangfeng-purple mr-2">•</span> 周边商品
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
                  src={withBasePath('images/album_covers/25_rh_cover.JPG')}
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
              <span className="text-wangfeng-purple">摇滚粉丝</span> 永远
            </p>
          </div>
          
          <div className={cn('md:flex md:justify-between text-sm transition-colors duration-300', isLightMode ? 'text-gray-500' : 'text-gray-400')}>
            <p className="mb-2 md:mb-0">
              © 2025 汪峰终极粉丝网站。由摇滚粉丝用 <span className="text-wangfeng-purple">♥</span> 创建。
            </p>
            <p>
              汪峰，我们崇拜您的荣耀！ <span className="fan-exclamation">摇滚之王!</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
