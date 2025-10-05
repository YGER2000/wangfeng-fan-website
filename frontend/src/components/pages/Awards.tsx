import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Calendar, Music, Award, Star, Medal } from 'lucide-react';

interface AwardRecord {
  year: string;
  award: string;
  work?: string;
  result: '获奖' | '提名';
  category: string;
}

const Awards = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  // 获奖记录数据
  const awardRecords: AwardRecord[] = [
    // 2024-2025年最新获奖
    { year: '2025-6', award: '第三届浪潮音乐大赏最佳摇滚歌曲', work: '我真的需要吗', result: '获奖', category: '歌曲奖项' },
    { year: '2024-12', award: '2024年度音乐行业报告年度时代创作人', result: '获奖', category: '个人奖项' },
    { year: '2024-12', award: '2024年度音乐行业报告年度时代金曲', work: '一代人', result: '获奖', category: '歌曲奖项' },
    { year: '2024-12', award: '2024年度音乐行业报告年度摇滚金曲', work: '我真的需要吗', result: '获奖', category: '歌曲奖项' },
    { year: '2024-12', award: '2024搜狐时尚盛典年度音乐人物', result: '获奖', category: '个人奖项' },
    { year: '2024-6-30', award: '第十五届华语金曲奖年度最佳国语男歌手', result: '获奖', category: '个人奖项' },
    { year: '2024-6-30', award: '第十五届华语金曲奖十大华语唱片之国语十大唱片', work: '也许我可以无视死亡', result: '获奖', category: '专辑奖项' },
    
    // 2018-2023年
    { year: '2023', award: '年度榜样音乐人', result: '获奖', category: '个人奖项' },
    { year: '2021', award: '全球中文音乐榜优秀原创音乐特别贡献奖', result: '获奖', category: '个人奖项' },
    { year: '2019-8', award: '2019华人歌曲排行榜年度金曲', work: '灿烂的你', result: '获奖', category: '歌曲奖项' },
    { year: '2019-8', award: '2019华人歌曲排行榜华人年度歌手', result: '获奖', category: '个人奖项' },
    { year: '2018-8', award: '2018华人歌曲音乐盛典年度金曲', work: '时代的标记', result: '获奖', category: '歌曲奖项' },
    { year: '2018-8', award: '2018华人歌曲音乐盛典年度最佳专辑', work: '果岭里29号', result: '获奖', category: '专辑奖项' },
    { year: '2018-8', award: '2018华人歌曲音乐盛典华人年度歌手', result: '获奖', category: '个人奖项' },
    
    // 2010-2016年
    { year: '2016-4-28', award: 'HelloFuture-GMICX年度盛典-2016互联网时代最具影响力歌手', result: '获奖', category: '个人奖项' },
    { year: '2015-4-17', award: '第19届全球华语榜中榜-亚洲影响力最佳演唱会', work: '峰暴来临', result: '获奖', category: '演出奖项' },
    { year: '2015-3-11', award: '第19届全球华语榜中榜最佳男歌手（内地）', result: '获奖', category: '个人奖项' },
    { year: '2014-11-27', award: '2014芭莎男士年度卓越成就音乐人', result: '获奖', category: '个人奖项' },
    { year: '2013-3', award: '东方风云榜20周年盛典二十年至尊金曲', work: '春天里', result: '获奖', category: '歌曲奖项' },
    { year: '2013-3', award: '东方风云榜20周年盛典内地最受欢迎歌手', result: '获奖', category: '个人奖项' },
    { year: '2012-6', award: '第十二届华语音乐传媒大奖最佳国语专辑', work: '生无所求', result: '获奖', category: '专辑奖项' },
    { year: '2012-6', award: '第12届华语音乐传媒大奖最佳国语男歌手', result: '获奖', category: '个人奖项' },
    { year: '2012-4', award: '第十二届音乐风云榜年度盛典最佳男歌手', result: '获奖', category: '个人奖项' },
    { year: '2011-9', award: '《南方人物周刊》2011中国艺术家权力榜', result: '提名', category: '个人奖项' },
    { year: '2010-4', award: '蒙牛酸酸乳音乐风云榜十年盛典十年内地十大金曲', work: '怒放的生命', result: '获奖', category: '歌曲奖项' },
    { year: '2010-5', award: '第十届华语音乐传媒大奖最佳摇滚艺人', result: '获奖', category: '个人奖项' },
    { year: '2010-3', award: '第十七届东方风云榜年度十大金曲', work: '春天里', result: '获奖', category: '歌曲奖项' },
    { year: '2010-3', award: '第十七届东方风云榜最佳男歌手', result: '获奖', category: '个人奖项' },
    { year: '2010-1', award: '2009星光大典年度专辑', work: '信仰在空中飘扬', result: '获奖', category: '专辑奖项' },
    { year: '2009-11', award: '第九届全球华语歌曲排行榜最佳专辑奖', work: '信仰在空中飘扬', result: '获奖', category: '专辑奖项' },
    { year: '2009-11', award: '第九届全球华语歌曲排行榜年度最佳制作人奖', work: '春天里', result: '获奖', category: '个人奖项' },
    
    // 2005-2006年
    { year: '2006-4', award: '百事风云榜中国内地最佳男歌手', result: '获奖', category: '个人奖项' },
    { year: '2005-6', award: '中歌榜中国年度最受华人欢迎十大金曲', work: '飞的更高', result: '获奖', category: '歌曲奖项' },
    { year: '2005-3', award: '百事可乐风云榜中国内地最佳摇滚歌手', result: '获奖', category: '个人奖项' },
    { year: '2005-1', award: '中国歌曲排行榜中国内地最佳原创歌手奖', result: '获奖', category: '个人奖项' },
    
    // 2000-2003年
    { year: '2003-4', award: '最佳原创公益歌曲', work: '直到永远', result: '获奖', category: '歌曲奖项' },
    { year: '2003-1', award: '第九届channel V全球华语榜最佳音乐录影带', work: '在雨中', result: '提名', category: '歌曲奖项' },
    { year: '2003-1', award: '第十届中国歌曲排行榜十五大金曲奖', work: '在雨中', result: '获奖', category: '歌曲奖项' },
    { year: '2003-1', award: '第十届中国歌曲排行榜最佳创作歌手', result: '提名', category: '个人奖项' },
    { year: '2002-6', award: '首届中国唱片金碟奖最佳摇滚歌手', result: '获奖', category: '个人奖项' },
    { year: '2002-4', award: '台湾中华音乐人交流协会年度十大专辑奖', work: '花火', result: '获奖', category: '专辑奖项' },
    { year: '2002-4', award: '雪碧我的选择中国歌曲排行榜2001年度内地最佳创作男歌手', result: '获奖', category: '个人奖项' },
    { year: '2002-2', award: '第21届香港电影金像奖最佳原创电影歌曲', work: '回忆之前，忘记之后', result: '提名', category: '歌曲奖项' },
    { year: '2001-11', award: '北京音乐台中国歌曲排行榜季度十大金曲获奖歌曲', work: '英雄', result: '获奖', category: '歌曲奖项' },
    { year: '2001-8', award: '北京音乐台中国歌曲排行榜季度十大金曲获奖歌曲', work: '青春', result: '获奖', category: '歌曲奖项' },
    { year: '2001-6', award: '北京音乐台中国歌曲排行榜季度十大金曲获奖歌曲', work: '迷鹿', result: '获奖', category: '歌曲奖项' },
    { year: '2001-3', award: '北京音乐台中国歌曲排行榜2000年度十大金曲', work: '再见二十世纪', result: '获奖', category: '歌曲奖项' },
    { year: '2000-8', award: '北京音乐台中国歌曲排行榜季度十大金曲奖', work: '再见二十世纪', result: '获奖', category: '歌曲奖项' },
    { year: '1997', award: '亚洲卫视中文台，凤凰卫视评选大陆最佳年度男艺人', result: '提名', category: '个人奖项' },
  ];

  const categories = ['全部', '个人奖项', '歌曲奖项', '专辑奖项', '演出奖项'];
  const filteredAwards = selectedCategory === '全部' 
    ? awardRecords 
    : awardRecords.filter(award => award.category === selectedCategory);

  // 统计数据
  const stats = {
    total: awardRecords.length,
    awards: awardRecords.filter(record => record.result === '获奖').length,
    nominations: awardRecords.filter(record => record.result === '提名').length,
    songAwards: awardRecords.filter(record => record.category === '歌曲奖项' && record.result === '获奖').length,
    personalAwards: awardRecords.filter(record => record.category === '个人奖项' && record.result === '获奖').length,
    albumAwards: awardRecords.filter(record => record.category === '专辑奖项' && record.result === '获奖').length,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '个人奖项': return <Star className="w-5 h-5" />;
      case '歌曲奖项': return <Music className="w-5 h-5" />;
      case '专辑奖项': return <Award className="w-5 h-5" />;
      case '演出奖项': return <Trophy className="w-5 h-5" />;
      default: return <Medal className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        {/* 头部标题 */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
            奖项 <span className="text-wangfeng-purple animate-pulse-glow">成就</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰的荣誉殿堂
          </h2>
          <p className="theme-text-secondary text-lg max-w-2xl mx-auto">
            从1997年至今，记录汪峰音乐生涯中获得的各类奖项与荣誉认可
          </p>
        </motion.div>

        {/* 统计数据卡片 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-8 mb-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">{stats.total}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">总记录</div>
              <div className="theme-text-secondary text-sm">获奖+提名</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-green-400 animate-pulse-glow mb-2">{stats.awards}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">获奖</div>
              <div className="theme-text-secondary text-sm">成功获得</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-blue-400 animate-pulse-glow mb-2">{stats.nominations}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">提名</div>
              <div className="theme-text-secondary text-sm">入围认可</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">{stats.songAwards}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">歌曲奖</div>
              <div className="theme-text-secondary text-sm">单曲荣誉</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">{stats.personalAwards}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">个人奖</div>
              <div className="theme-text-secondary text-sm">艺人成就</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bebas text-wangfeng-purple animate-pulse-glow mb-2">{stats.albumAwards}</div>
              <div className="font-bold theme-text-primary text-lg mb-1">专辑奖</div>
              <div className="theme-text-secondary text-sm">专辑荣誉</div>
            </div>
          </div>
        </motion.div>

        {/* 分类筛选 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${
                selectedCategory === category
                  ? 'bg-wangfeng-purple theme-text-primary shadow-glow animate-pulse-glow'
                  : 'theme-bg-card theme-text-secondary border theme-border-primary hover:bg-wangfeng-purple/20 hover:text-wangfeng-purple'
              }`}
            >
              {getCategoryIcon(category)}
              {category}
            </button>
          ))}
        </motion.div>

        {/* 获奖记录列表 */}
        <div className="space-y-6">
          {filteredAwards.map((award, index) => (
            <motion.div
              key={`award-${index}`}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`theme-bg-card rounded-xl border-2 p-6 shadow-glow transition-all duration-300 hover:scale-105 ${
                award.result === '获奖' 
                  ? 'border-green-400/30 hover:border-green-400/50' 
                  : 'border-blue-400/30 hover:border-blue-400/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* 年份和结果 */}
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className={`text-2xl font-bold mb-1 ${
                    award.result === '获奖' ? 'text-green-400' : 'text-blue-400'
                  }`}>
                    {award.year}
                  </div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    award.result === '获奖' 
                      ? 'bg-green-400/20 text-green-400' 
                      : 'bg-blue-400/20 text-blue-400'
                  }`}>
                    {award.result === '获奖' ? <Trophy className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                    {award.result}
                  </div>
                </div>

                {/* 分类图标 */}
                <div className="flex-shrink-0 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-wangfeng-purple/20 rounded-full text-wangfeng-purple">
                    {getCategoryIcon(award.category)}
                  </div>
                  <div className="text-xs text-wangfeng-purple font-medium mt-1">
                    {award.category}
                  </div>
                </div>

                {/* 奖项信息 */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold theme-text-primary mb-2">{award.award}</h3>
                  {award.work && (
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="w-4 h-4 text-wangfeng-purple" />
                      <span className="text-wangfeng-purple font-semibold">作品：《{award.work}》</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 theme-text-secondary text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>获奖时间：{award.year}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 底部统计 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-16"
        >
          <div className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-6 max-w-md mx-auto">
            <p className="theme-text-secondary mb-2">
              当前显示 <span className="text-wangfeng-purple font-bold">{filteredAwards.length}</span> 项记录
            </p>
            <p className="text-sm theme-text-muted">
              涵盖 <span className="text-green-400 font-bold">{stats.awards}</span> 个获奖 + 
              <span className="text-blue-400 font-bold"> {stats.nominations}</span> 个提名
            </p>
            <div className="mt-4 pt-4 border-t theme-border-primary">
              <p className="text-xs text-wangfeng-purple italic">
                "音乐是我的生命，奖项是对音乐的认可" - 汪峰
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Awards;