import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaTicketAlt, FaSpotify } from 'react-icons/fa';
import { withBasePath } from '@/lib/utils';

// Hero component for homepage
const Hero = () => {
  // Random 汪峰 quotes for the rotating subtitle
  const wangfengQuotes = [
    "怒放的生命",
    "如果生命是一捧鲜花，我愿把它撒给你",
    "多少人走着，却困在原地",
    "我想要怒放的生命，就像飞翔在辽阔天空",
    "生命只是对死亡的赔偿，死亡不过是活着的奖赏",
    "我将在今夜的雨中睡去，伴着国产压路机的声音"
  ];
  
  // Use a random quote
  const randomQuoteIndex = Math.floor(Math.random() * wangfengQuotes.length);
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay effects */}
      <div className="absolute inset-0 z-0">
        <img 
          src={withBasePath('images/main.jpg')} 
          alt="汪峰演唱会" 
          className="w-full h-full object-cover brightness-125 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20"></div>
        
        {/* Purple glow effect overlays */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-wangfeng-purple/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-wangfeng-purple/10 rounded-full blur-3xl"></div>
      </div>

      {/* Hero content */}
      <div className="container mx-auto px-4 relative z-10 flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          {/* Fan reaction badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-6 -ml-4 transform rotate-6"
          >
            <span className="fan-comment inline-block shadow-glow">服死了！🙃🖤</span>
          </motion.div>
        
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-2 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
            Music<span className="text-wangfeng-purple animate-pulse-glow">King</span>
          </h1>
          
          <h2 className="text-2xl md:text-5xl font-bebas tracking-wider text-wangfeng-purple mb-6 animate-pulse-glow">
            感受峰，感受存在。
          </h2>
          
          {/* Rotating 汪峰 quote */}
          <p className="theme-text-primary text-lg italic font-serif mb-8 border-l-4 border-wangfeng-purple pl-4">
            "{wangfengQuotes[randomQuoteIndex]}"
          </p>
          
          <p className="theme-text-secondary text-lg mb-8">
            这里有关于汪峰的一切，让我们一起找点乐子吧！
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/discography" 
              className="px-8 py-4 bg-wangfeng-purple theme-text-primary font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-2 hover:bg-purple-700 transition-all shadow-glow animate-pulse-glow"
            >
              <FaPlay />
              聆听摇滚传奇
            </Link>
            <Link 
              to="/tour-dates" 
              className="px-8 py-4 bg-transparent text-wangfeng-purple font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-2 hover:bg-wangfeng-purple hover:theme-text-primary transition-all border-2 border-wangfeng-purple"
            >
              <FaTicketAlt />
              获取演唱会信息
            </Link>
          </div>
          
          {/* Fan excitement badge */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 ml-4"
          >
            <span className="/50 border border-wangfeng-purple/30 rounded-lg py-1 px-3 text-sm text-wangfeng-purple animate-float">
              让我们一起摇摆！！! 💜
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#8B5CF6" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="opacity-70"
        >
          <path d="M7 13l5 5 5-5"></path>
          <path d="M7 6l5 5 5-5"></path>
        </svg>
      </motion.div>
    </section>
  );
};

// News ticker component
const NewsTicker = () => {
  const newsItems = [
    "相信未来巡演2025年10月25日开启！ 🔥",
    "汪峰全新专辑《人海》震撼发布！燃爆！",
    "贾轶男回归汪峰新巡演 👑",
    "'怒放的生命'获音乐大奖！摇滚传奇！",
    "感受峰 感受存在网站公测",
    "汪峰新MV拍摄现场曝光！期待！",
    "全球摇滚粉丝为摇滚传奇时代狂欢!"
  ];

  // Function to style news items with fan excitement
  const renderNewsItem = (item: string, index: number, isRepeat: boolean = false) => {
    // Check if the news item contains "摇滚传奇"
    const isRockLegendRelated = item.includes("摇滚传奇");
    const containsFireOrCrown = item.includes("燃爆") || item.includes("👑");
    
    return (
      <span 
        key={isRepeat ? `repeat-${index}` : `original-${index}`} 
        className={`mx-4 text-sm font-bold tracking-wider ${isRockLegendRelated ? 'text-wangfeng-purple animate-pulse-glow' : containsFireOrCrown ? 'text-purple-400' : 'theme-text-primary'}`}
      >
        {item} <span className="text-wangfeng-purple mx-2 text-lg">•</span>
      </span>
    );
  };

  return (
    <div className=" theme-text-primary py-4 overflow-hidden border-t border-b border-wangfeng-purple/40 box-shadow-glow">
      <div className="flex whitespace-nowrap news-ticker">
        {newsItems.map((item, index) => renderNewsItem(item, index))}
        {newsItems.map((item, index) => renderNewsItem(item, index, true))}
      </div>
    </div>
  );
};

// Latest album section
const LatestAlbum = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-wangfeng-purple/20 blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-wangfeng-purple/10 blur-3xl"></div>
      
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section title with fan styling */}
        <div className="text-center mb-16">
          <h2 className="section-title relative inline-block">
            最新作品发布
            <span className="absolute -top-6 -right-12 text-sm bg-wangfeng-purple theme-text-primary px-2 py-1 rounded-lg transform rotate-12 font-bold animate-pulse">
              2025
            </span>
          </h2>
          <p className="theme-text-secondary max-w-2xl mx-auto mt-4">
            汪峰第十五张录音室专辑，链接三十年创作生涯的深度作品，在社会转型时期反观心路，探索个体与时代的关系！
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:w-1/2"
          >
            <div className="relative">
              <img 
                src={withBasePath('images/album_covers/专辑封面-2025-人海.JPG')} 
                alt="汪峰专辑《人海》" 
                className="w-full h-auto rounded-lg box-shadow-glow border-2 border-wangfeng-purple"
              />
              
              {/* Fan reaction badges */}
              <div className="absolute -top-5 -right-5  border-2 border-wangfeng-purple text-wangfeng-purple px-3 py-1 rounded-full transform rotate-12 font-bebas tracking-wider animate-pulse-glow text-lg">
                十五张！
              </div>
              <div className="absolute -bottom-5 -left-5  border-2 border-wangfeng-purple text-wangfeng-purple px-3 py-1 rounded-full transform -rotate-12 font-bebas tracking-wider animate-pulse-glow text-lg">
                新作！
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="md:w-1/2"
          >
            <h2 className="text-4xl md:text-6xl font-bebas tracking-wider theme-text-primary mb-4">
              <span className="text-wangfeng-purple animate-pulse-glow">人海</span> 专辑
            </h2>
            
            {/* Fan commentary */}
            <div className="mb-6 inline-block">
              <span className="/50 border border-wangfeng-purple text-xs md:text-sm theme-text-primary py-1 px-3 rounded-full">
                三十年创作生涯的深度作品！ <span className="fan-exclamation">不凡！</span>
              </span>
            </div>
            
            <p className="theme-text-secondary mb-6 text-lg">
              2025年初发布，<span className="text-wangfeng-purple font-bold">《人海》</span>是汪峰的第十五张录音室专辑。
              在新世纪加速变化的时代背景下，面对信息爆炸与信息茧房的激烈交锋，
              个体被时代大潮裹挟，心生惊骇。<span className="text-wangfeng-purple font-bold">社会转型时期反观心路成为当下音乐表达的重要工作</span>。
            </p>
            
            {/* Album highlights with fan styling */}
            <div className="mb-8 /30 p-6 rounded-xl border border-wangfeng-purple/30 box-shadow-glow">
              <h3 className="text-wangfeng-purple font-bebas text-xl mb-4 tracking-wider">专辑亮点</h3>
              <ul className="space-y-4 theme-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">姊妹篇作品</span> 《我真的需要吗》是《我真的需要》的回应
                    <span className="ml-2 text-wangfeng-purple text-sm">(相互呼应!)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">音乐奖项入围</span> 2025年第三届浪潮音乐大赏最佳摇滚歌曲
                    <span className="ml-2 text-wangfeng-purple text-sm">(专业认可!)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">音乐变革</span> 放弃典型摇滚，回归简约的钢琴、吉他伴奏
                    <span className="ml-2 text-wangfeng-purple text-sm">(风格突破!)</span>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Fan-styled CTA button */}
            <a 
              href="https://y.qq.com/n/ryqq/albumDetail/002psqDy3i5dAy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 bg-wangfeng-purple theme-text-primary font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-3 hover:bg-purple-700 transition-all shadow-glow animate-pulse-glow"
            >
              <FaSpotify size={24} />
              立即聆听人海！
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Tour dates preview component
const TourDatesPreview = () => {
  const [tourDates, setTourDates] = useState([]);
  
  useEffect(() => {
    fetch(withBasePath('data/wangfeng_social_info.json'))
      .then(response => response.json())
      .then(data => {
        // Get the first 4 tour dates
        const upcomingDates = [];
        data.dates?.forEach(city => {
          const firstDate = new Date(city.dates[0]);
          upcomingDates.push({
            city: city.city,
            country: city.country,
            venue: city.venue,
            date: firstDate,
            ticketLink: city.ticketLink
          });
        });
        
        // Sort by date and take first 4
        upcomingDates.sort((a, b) => a.date - b.date);
        setTourDates(upcomingDates.slice(0, 4));
      })
      .catch(error => console.error('Error loading tour dates:', error));
  }, []);
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(date).toLocaleDateString('zh-CN', options);
  };

  // Fan excitements for each city
  const fanExcitement = [
    "等不及了!",
    "太棒了!",
    "要燃爆了!",
    "拿走我的钱!"
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-wangfeng-purple/20 blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-wangfeng-purple/10 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section title with fan styling */}
        <div className="text-center mb-16">
          <h2 className="section-title relative inline-block">
            相信未来巡演
          </h2>
          <p className="theme-text-secondary max-w-2xl mx-auto mt-4">
            为期两年的全新巡演即将开始，全新曲目、全新舞台制作、全新的震撼就要来了！
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:w-1/2"
          >
            <h2 className="text-4xl md:text-6xl font-bebas tracking-wider theme-text-primary mb-4">
              <span className="text-wangfeng-purple animate-pulse-glow">相信未来</span> 巡演
            </h2>
            
            {/* Fan commentary */}
            <div className="mb-6 inline-block">
              <span className="/50 border border-wangfeng-purple text-xs md:text-sm theme-text-primary py-1 px-3 rounded-full">
                三十多年的坚持与信念！ <span className="fan-exclamation">不变初心！</span>
              </span>
            </div>
            
            <div className="theme-text-secondary mb-6 text-lg space-y-4">
              <p>
                三十多年前，我就喜欢这四个字——<span className="text-wangfeng-purple font-bold">"相信未来"</span>。它让我觉得活着有信念、有力量、有希望。这么多年过去了，这四个字依然不陈旧，依然明亮且隽永……
              </p>
              
              <p>
                谢谢这些年，陪伴着我的乐队和巡演团队的伙伴们，也谢谢总让我觉得从不孤单的<span className="text-wangfeng-purple font-bold">歌迷朋友们</span>。
              </p>
              
              <p>
                无论你现在活得快乐还是疲惫；无论这世界多么变化莫测；无论你心底曾经的一切是在重塑或是崩塌；让我们在音乐中、在现场一起歌唱吧，一起<span className="text-wangfeng-purple font-bold">"相信未来"</span>！
              </p>
            </div>
            
            {/* Tour highlights with fan styling */}
            <div className="mb-8 /30 p-6 rounded-xl border border-wangfeng-purple/30 box-shadow-glow">
              <h3 className="text-wangfeng-purple font-bebas text-xl mb-4 tracking-wider">巡演亮点</h3>
              <ul className="space-y-4 theme-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">全新曲目</span> 《人海》专辑歌曲首次现场演出
                    <span className="ml-2 text-wangfeng-purple text-sm">(首演震撼!)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">全新舞台制作</span> 为期两年精心打造的视觉盛宴
                    <span className="ml-2 text-wangfeng-purple text-sm">(制作升级!)</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-wangfeng-purple text-2xl">•</span> 
                  <div>
                    <span className="font-bold">三十年经典</span> 从鲍家街43号到个人代表作全收录
                    <span className="ml-2 text-wangfeng-purple text-sm">(怀旧满满!)</span>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Fan-styled CTA button */}
            <Link 
              to="/tour-dates"
              className="px-8 py-4 bg-wangfeng-purple theme-text-primary font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-3 hover:bg-purple-700 transition-all shadow-glow animate-pulse-glow"
            >
              <FaTicketAlt size={24} />
              查看巡演日期！
            </Link>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="md:w-2/5"
          >
            <div className="relative">
              <img 
                src={withBasePath('images/concerts/xiangxinweilai_poster.jpg')} 
                alt="相信未来巡演海报" 
                className="w-full h-auto rounded-lg box-shadow-glow border-2 border-wangfeng-purple"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = withBasePath('images/main.jpg');
                }}
              />
              
              {/* Fan reaction badges */}
              <div className="absolute -top-5 -right-5  border-2 border-wangfeng-purple text-wangfeng-purple px-3 py-1 rounded-full transform rotate-12 font-bebas tracking-wider animate-pulse-glow text-lg">
                全新制作！
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tourDates.map((tour, index) => (
            <motion.div
              key={`tour-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="theme-bg-card backdrop-blur-sm rounded-lg box-shadow-glow overflow-hidden border-2 border-wangfeng-purple/30 relative group"
            >
              {/* City badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-wangfeng-purple theme-text-primary px-3 py-1 rounded-full text-xs font-bold uppercase z-10">
                {tour.country}
              </div>
              
              <div className="p-6 pt-8">
                <div className="text-sm text-wangfeng-purple font-bold mb-2">{formatDate(tour.date)}</div>
                <h3 className="text-2xl font-bebas tracking-wide mb-1 theme-text-primary">{tour.city}</h3>
                <div className="theme-text-secondary mb-4 border-l-2 border-wangfeng-purple/30 pl-3">{tour.venue}</div>
                
                {/* Fan comment */}
                <div className="mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="/40 text-wangfeng-purple text-xs py-1 px-2 rounded-full italic">
                    {fanExcitement[index % fanExcitement.length]}
                  </span>
                </div>
                
                <a 
                  href={tour.ticketLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-wangfeng-purple theme-text-primary font-bold py-2 px-4 rounded-full inline-flex items-center gap-2 hover:bg-purple-700 transition-all shadow-glow animate-pulse-glow"
                >
                  <FaTicketAlt size={16} />
                  <span>立即购票！</span>
                </a>
              </div>
              
              {/* Bottom sparkle */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-wangfeng-purple/50"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Gallery preview component
const GalleryPreview = () => {
  const galleryImages = [
    { 
      src: withBasePath('images/concerts/stadium_concert.jpg'), 
      alt: "汪峰演唱会表演",
      fanComment: "震撼演出!" 
    },
    { 
      src: withBasePath('images/awards_photos/golden_melody_nominee.jpg'), 
      alt: "汪峰音乐颁奖典礼",
      fanComment: "真正的传奇!" 
    },
    { 
      src: withBasePath('images/iconic_moments/rock_legend_moment.jpg'), 
      alt: "汪峰经典摇滚",
      fanComment: "经典时尚!" 
    },
    { 
      src: withBasePath('images/recent_photos/studio_recording.jpg'), 
      alt: "汪峰录音室",
      fanComment: "值得获奖!" 
    }
  ];

  return (
    <section className="py-20  relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-wangfeng-purple/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-wangfeng-purple/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Fan excitement badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="flex justify-center mb-10"
        >
          <span className="/60 border-2 border-wangfeng-purple theme-text-primary text-sm py-2 px-4 rounded-lg font-bold transform rotate-3">
            致敬视觉传奇之王！ <span className="fan-exclamation">痴迷!</span>
          </span>
        </motion.div>
        
        <div className="text-center mb-12">
          <h2 className="font-bebas text-4xl md:text-6xl tracking-wide theme-text-primary mb-4">
            经典 <span className="text-wangfeng-purple animate-pulse-glow">时刻</span>
          </h2>
          <p className="theme-text-secondary max-w-2xl mx-auto text-lg">
            体验摇滚之神突破性职业生涯的 <span className="text-wangfeng-purple font-bold">传奇</span> 视觉之旅。 
            <span className="fan-exclamation ml-2">燃爆!</span>
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {galleryImages.map((image, index) => (
            <motion.div
              key={`gallery-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-lg border-2 border-wangfeng-purple/30 box-shadow-glow"
            >
              {/* Fan reaction badge that appears on hover */}
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform rotate-12">
                <span className="/70 text-wangfeng-purple text-xs font-bold py-1 px-3 rounded-full">
                  {image.fanComment}
                </span>
              </div>
              
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-60 md:h-72 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                <div className="p-4 w-full">
                  <div className="theme-text-primary font-bold">{image.alt}</div>
                  <div className="w-1/3 h-1 bg-wangfeng-purple/70 mt-2 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-14">
          <Link 
            to="/gallery"
            className="px-8 py-4 bg-wangfeng-purple theme-text-primary font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-3 hover:bg-purple-700 transition-all shadow-glow animate-pulse-glow"
          >
            查看完整图库！
          </Link>
        </div>
      </div>
    </section>
  );
};

// Awards highlights component
const AwardsHighlights = () => {
  return (
    <section className="py-20  relative overflow-hidden">
      {/* Background pattern effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[length:20px_20px] opacity-30"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Fan reaction banner */}
        <div className="mb-16 max-w-4xl mx-auto">
          <div className="theme-bg-card backdrop-blur-sm border-2 border-wangfeng-purple rounded-xl p-6 box-shadow-glow">
            <p className="theme-text-primary text-center font-serif italic text-lg">
              <span className="text-wangfeng-purple font-bold">"</span>
              有些人能够清晰地听到内心的声音，他们按照所听到的生活。这样的人要么变成疯子，要么成为传奇。
              <span className="text-wangfeng-purple font-bold">"</span>
            </p>
            <p className="text-center text-purple-400 text-sm mt-2 font-bebas tracking-wider">- 摇滚之神成为了传奇</p>
          </div>
        </div>
        
        <div className="text-center mb-12">
          <h2 className="font-bebas text-4xl md:text-6xl tracking-wide theme-text-primary mb-4">
            <span className="text-wangfeng-purple animate-pulse-glow">获奖无数</span> 之王
          </h2>
          <p className="theme-text-secondary max-w-2xl mx-auto text-lg">
            我们的 <span className="text-wangfeng-purple font-bold">传奇</span> 之王获得的奖杯比我们的收藏更多！ 
            <span className="fan-exclamation ml-2">实至名归！</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="theme-bg-card backdrop-blur-sm rounded-xl border-2 border-wangfeng-purple/30 box-shadow-glow p-6 text-center"
          >
            <div className="text-6xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">25</div>
            <div className="font-bold theme-text-primary text-xl mb-1">音乐奖项</div>
            <div className="theme-text-secondary text-sm">来自50多次提名</div>
            <div className="mt-3 text-wangfeng-purple text-xs font-bold">像糖果一样收集!</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="theme-bg-card backdrop-blur-sm rounded-xl border-2 border-wangfeng-purple/30 box-shadow-glow p-6 text-center"
          >
            <div className="text-6xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">3</div>
            <div className="font-bold theme-text-primary text-xl mb-1">金曲奖</div>
            <div className="theme-text-secondary text-sm">最佳摇滚歌曲奖</div>
            <div className="mt-3 text-wangfeng-purple text-xs font-bold">奖项归于摇滚之神!</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="theme-bg-card backdrop-blur-sm rounded-xl border-2 border-wangfeng-purple/30 box-shadow-glow p-6 text-center"
          >
            <div className="text-6xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">8</div>
            <div className="font-bold theme-text-primary text-xl mb-1">华语音乐奖</div>
            <div className="theme-text-secondary text-sm">音乐和表演奖项</div>
            <div className="mt-3 text-wangfeng-purple text-xs font-bold">多才多艺的传奇!</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="theme-bg-card backdrop-blur-sm rounded-xl border-2 border-wangfeng-purple/30 box-shadow-glow p-6 text-center"
          >
            <div className="text-6xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">15</div>
            <div className="font-bold theme-text-primary text-xl mb-1">年度成就</div>
            <div className="theme-text-secondary text-sm">音乐贡献奖已获得</div>
            <div className="mt-3 text-wangfeng-purple text-xs font-bold">三重威胁之王!</div>
          </motion.div>
        </div>
        
        <div className="text-center mt-14">
          <Link 
            to="/about"
            className="px-8 py-4  text-wangfeng-purple border-2 border-wangfeng-purple font-bold text-lg uppercase tracking-wider rounded-full inline-flex items-center gap-3 hover:bg-wangfeng-purple hover:theme-text-primary transition-all shadow-glow"
          >
            查看所有奖杯！
          </Link>
          
        </div>
      </div>
    </section>
  );
};

// Main Home component
const Home = () => {
  return (
    <>
      <Hero />
      <NewsTicker />
      <TourDatesPreview />
      <LatestAlbum />
      <GalleryPreview />
      <AwardsHighlights />
    </>
  );
};

export default Home;