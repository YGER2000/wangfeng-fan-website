import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, GraduationCap, Music, Award, BookOpen, Heart } from 'lucide-react';

interface ArtistBio {
  basicInfo: {
    name: string;
    chineseName: string;
    birthDate: string;
    birthPlace: string;
    nationality: string;
    education: string;
    occupation: string[];
    description: string;
  };
  mainBiography: string;
  careerTimeline: Array<{
    year: string;
    event: string;
    description: string;
  }>;
  majorWorks: {
    albums: Array<{
      name: string;
      year: string;
      type: string;
      description: string;
    }>;
    representativeSongs: Array<{
      name: string;
      album: string;
      year: string;
      significance: string;
    }>;
    literaryWorks: Array<{
      name: string;
      year: string;
      type: string;
      description: string;
    }>;
  };
  achievements: Array<{
    year: string;
    award: string;
    category: string;
    significance: string;
    album?: string;
  }>;
  personalLife: {
    education: string;
    interests: string[];
    creativePhilosophy: string;
    literaryPursuit: string;
  };
  musicalStyle: {
    genres: string[];
    characteristics: string[];
    evolution: string;
  };
  socialImpact: {
    musicInfluence: string;
    culturalContribution: string;
    artisticPursuit: string;
    crossFieldAchievement: string;
  };
  significantEvents: Array<{
    year: string;
    event: string;
    description: string;
  }>;
}

const About = () => {
  const [loading, setLoading] = useState(false); // 改为false，直接显示数据
  
  // 直接使用静态数据，避免网络请求问题
  const artistBio: ArtistBio = {
    basicInfo: {
      name: "汪峰",
      chineseName: "汪峰", 
      birthDate: "1971年6月29日",
      birthPlace: "北京市",
      nationality: "中国",
      education: "中央音乐学院",
      occupation: ["歌手", "音乐人", "创作人"],
      description: "中国内地男歌手、音乐人，毕业于中央音乐学院"
    },
    mainBiography: "汪峰，1971年6月29日出生于北京市，毕业于中央音乐学院，中国内地男歌手、音乐人。1994年，汪峰组建'鲍家街43号'乐队，并担任主唱。1997年、1998年，随乐队发行《鲍家街43号》《风暴来临》两张专辑。2000年，汪峰加盟华纳唱片开始个人发展，并发行个人首张音乐专辑《花火》。2002年，发行音乐专辑《爱是一颗幸福的子弹》。2004年，发行音乐专辑《笑着哭》，其中歌曲《飞得更高》成为其代表作。2005年，发行音乐专辑《怒放的生命》。2006年，获得第6届音乐风云榜'内地最佳男歌手奖'。2007年，发行音乐专辑《勇敢的心》。2009年，发行音乐专辑《信仰在空中飘扬》，并凭借该专辑获得第9届全球华语歌曲排行榜年度最佳专辑奖、年度最佳制作人奖。2012年，出版个人首部小说《晚安北京》。2013年，首次登上央视春晚的舞台，演唱歌曲《我爱你中国》；同年，发行音乐专辑《生来彷徨》。",
    careerTimeline: [
      {
        year: "1994",
        event: "音乐生涯起步",
        description: "组建'鲍家街43号'乐队，担任主唱，开始音乐之路。"
      },
      {
        year: "1997",
        event: "乐队首张专辑", 
        description: "随鲍家街43号乐队发行首张专辑《鲍家街43号》。"
      },
      {
        year: "1998",
        event: "乐队第二张专辑",
        description: "随乐队发行专辑《风暴来临》，确立摇滚风格。"
      },
      {
        year: "2000",
        event: "个人发展起点",
        description: "加盟华纳唱片开始个人发展，发行个人首张音乐专辑《花火》。"
      },
      {
        year: "2004",
        event: "代表作诞生",
        description: "发行音乐专辑《笑着哭》，其中歌曲《飞得更高》成为其代表作品。"
      },
      {
        year: "2005", 
        event: "音乐巅峰",
        description: "发行音乐专辑《怒放的生命》，展现生命力量的音乐理念。"
      },
      {
        year: "2009",
        event: "双重荣誉", 
        description: "发行音乐专辑《信仰在空中飘扬》，获得第9届全球华语歌曲排行榜年度最佳专辑奖和年度最佳制作人奖。"
      },
      {
        year: "2013",
        event: "春晚舞台",
        description: "首次登上央视春晚的舞台，演唱歌曲《我爱你中国》；发行音乐专辑《生来彷徨》。"
      }
    ],
    majorWorks: {
      albums: [
        {
          name: "鲍家街43号",
          year: "1997",
          type: "乐队专辑",
          description: "乐队时期首张专辑作品"
        },
        {
          name: "花火",
          year: "2000", 
          type: "个人专辑",
          description: "个人首张音乐专辑，华纳唱片时期作品"
        },
        {
          name: "笑着哭",
          year: "2004",
          type: "个人专辑",
          description: "包含代表作《飞得更高》的经典专辑"
        },
        {
          name: "怒放的生命",
          year: "2005",
          type: "个人专辑", 
          description: "展现生命力量的标志性专辑"
        }
      ],
      representativeSongs: [
        {
          name: "飞得更高",
          album: "笑着哭",
          year: "2004", 
          significance: "汪峰的代表作品，广为传唱的经典歌曲"
        },
        {
          name: "怒放的生命",
          album: "怒放的生命",
          year: "2005",
          significance: "展现生命力量的标志性歌曲"
        }
      ],
      literaryWorks: [
        {
          name: "晚安北京",
          year: "2012",
          type: "小说",
          description: "汪峰个人首部小说作品，展现其多元化的艺术才华"
        }
      ]
    },
    achievements: [
      {
        year: "2006",
        award: "第6届音乐风云榜内地最佳男歌手奖",
        category: "音乐奖项",
        significance: "首次获得重要音乐奖项认可"
      },
      {
        year: "2009",
        award: "第9届全球华语歌曲排行榜年度最佳专辑奖", 
        category: "专辑奖项",
        album: "信仰在空中飘扬",
        significance: "专辑作品获得华语音乐界高度认可"
      }
    ],
    personalLife: {
      education: "毕业于中央音乐学院，接受了专业的音乐教育",
      interests: ["音乐创作", "文学写作", "艺术表达"],
      creativePhilosophy: "通过音乐表达人生感悟，传递正能量和人文关怀",
      literaryPursuit: "不仅在音乐领域有所建树，还涉足文学创作，2012年出版个人首部小说《晚安北京》"
    },
    musicalStyle: {
      genres: ["摇滚", "流行摇滚", "华语摇滚"],
      characteristics: [
        "深刻的歌词内容，富有哲理思考",
        "独特的嗓音特色，具有感染力", 
        "多元化的音乐风格，从摇滚到流行",
        "强烈的情感表达，触动人心"
      ],
      evolution: "从鲍家街43号乐队的摇滚风格，到个人发展后更加多元化的音乐表达"
    },
    socialImpact: {
      musicInfluence: "汪峰以其深刻的歌词和独特的音乐风格，在中国流行音乐界占有重要地位",
      culturalContribution: "代表作品《飞得更高》、《怒放的生命》等成为广为传唱的经典，影响了一代人",
      artisticPursuit: "不断追求音乐艺术的突破与创新，体现了音乐人的责任与担当", 
      crossFieldAchievement: "跨界文学创作，展现了多元化的艺术才华和深厚的文化底蕴"
    },
    significantEvents: [
      {
        year: "2013",
        event: "央视春晚首秀",
        description: "首次登上央视春晚的舞台，演唱歌曲《我爱你中国》，标志着其音乐成就得到主流认可"
      }
    ]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple mx-auto mb-4"></div>
          <p className="text-lg">加载个人资料中...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-5xl md:text-7xl font-bebas tracking-wider text-white mb-4">
            关于 <span className="text-wangfeng-purple animate-pulse-glow">汪峰</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            音乐路上的追梦人
          </h2>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          {/* 基本信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8 mb-12"
          >
            <div className="flex flex-col lg:flex-row gap-8">
              {/* 头像区域 */}
              <div className="flex-shrink-0 text-center lg:text-left">
                <div className="w-64 h-64 mx-auto lg:mx-0 rounded-2xl overflow-hidden border-4 border-wangfeng-purple/50 shadow-lg">
                  <img
                    src="/images/wangfeng.JPG"
                    alt={artistBio.basicInfo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/wangfeng.jpg';
                    }}
                  />
                </div>
              </div>

              {/* 基本信息 */}
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-white mb-6">{artistBio.basicInfo.name}</h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-wangfeng-purple" />
                    <span className="text-gray-300">出生日期：{artistBio.basicInfo.birthDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-wangfeng-purple" />
                    <span className="text-gray-300">出生地：{artistBio.basicInfo.birthPlace}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-wangfeng-purple" />
                    <span className="text-gray-300">毕业院校：{artistBio.basicInfo.education}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Music className="w-5 h-5 text-wangfeng-purple" />
                    <span className="text-gray-300">职业：{artistBio.basicInfo.occupation.join('、')}</span>
                  </div>
                </div>

                <p className="text-gray-200 text-lg leading-relaxed">
                  {artistBio.mainBiography}
                </p>
              </div>
            </div>
          </motion.div>

          {/* 职业生涯里程碑 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8 mb-12"
          >
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Award className="w-8 h-8 text-wangfeng-purple" />
              职业生涯里程碑
            </h3>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-wangfeng-purple/30"></div>
              
              {artistBio.careerTimeline.map((milestone, index) => (
                <motion.div
                  key={`timeline-${index}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="relative pl-12 pb-8"
                >
                  <div className="absolute left-2 w-4 h-4 bg-wangfeng-purple rounded-full border-2 border-black"></div>
                  <div className="/50 rounded-lg p-4 border border-wangfeng-purple/20">
                    <div className="text-wangfeng-purple font-bold text-xl mb-2">{milestone.year}年</div>
                    <div className="text-white font-semibold mb-1">{milestone.event}</div>
                    <div className="text-gray-200">{milestone.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 音乐风格与特色 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid lg:grid-cols-2 gap-8 mb-12"
          >
            <div className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8">
              <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Music className="w-8 h-8 text-wangfeng-purple" />
                音乐风格
              </h3>
              
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">音乐类型</h4>
                <div className="flex flex-wrap gap-2">
                  {artistBio.musicalStyle.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-wangfeng-purple/20 text-wangfeng-purple px-3 py-1 rounded-full text-sm border border-wangfeng-purple/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">音乐特色</h4>
                <ul className="space-y-2 mb-4">
                  {artistBio.musicalStyle.characteristics.map((char, index) => (
                    <li key={`characteristic-${index}`} className="text-gray-200 flex items-center gap-2">
                      <div className="w-2 h-2 bg-wangfeng-purple rounded-full"></div>
                      {char}
                    </li>
                  ))}
                </ul>
                
                <div>
                  <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">风格演进</h4>
                  <p className="text-gray-200">{artistBio.musicalStyle.evolution}</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8">
              <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Heart className="w-8 h-8 text-wangfeng-purple" />
                个人生活
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-wangfeng-purple mb-2">教育背景</h4>
                  <p className="text-gray-200 mb-4">{artistBio.personalLife.education}</p>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-wangfeng-purple mb-2">创作理念</h4>
                  <p className="text-gray-200 mb-4">{artistBio.personalLife.creativePhilosophy}</p>
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-wangfeng-purple mb-2">文学追求</h4>
                  <p className="text-gray-200 mb-4">{artistBio.personalLife.literaryPursuit}</p>
                </div>

                <div>
                  <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">兴趣爱好</h4>
                  <div className="flex flex-wrap gap-2">
                    {artistBio.personalLife.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="/50 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-600"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 获奖记录 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8 mb-12"
          >
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Award className="w-8 h-8 text-wangfeng-purple" />
              主要成就
            </h3>
            
            <div className="space-y-6">
              {artistBio.achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  className="/50 rounded-lg p-6 border border-wangfeng-purple/20"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="text-3xl font-bold text-wangfeng-purple">{achievement.year}年</div>
                      <div className="text-sm text-gray-400">{achievement.category}</div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-white mb-2">{achievement.award}</h4>
                      {achievement.album && (
                        <p className="text-wangfeng-purple text-sm mb-2">专辑：《{achievement.album}》</p>
                      )}
                      <p className="text-gray-200 text-sm">{achievement.significance}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 完整获奖记录 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8 mb-12"
          >
            <h3 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Award className="w-8 h-8 text-wangfeng-purple" />
              完整获奖记录
            </h3>
            
            <p className="text-gray-300 mb-6">
              从1997年至今，汪峰在音乐生涯中获得了众多奖项与荣誉认可。包括华语音乐传媒大奖、东方风云榜、全球华语榜中榜等权威奖项。代表作品《春天里》《怒放的生命》《飞的更高》等多次获得年度金曲奖项。
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-black/30 rounded-lg p-4 border border-wangfeng-purple/20">
                <p className="text-3xl font-bold text-wangfeng-purple mb-1">80+</p>
                <p className="text-sm text-gray-400">获奖记录</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-wangfeng-purple/20">
                <p className="text-3xl font-bold text-wangfeng-purple mb-1">30+</p>
                <p className="text-sm text-gray-400">个人奖项</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-wangfeng-purple/20">
                <p className="text-3xl font-bold text-wangfeng-purple mb-1">25+</p>
                <p className="text-sm text-gray-400">歌曲奖项</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-wangfeng-purple/20">
                <p className="text-3xl font-bold text-wangfeng-purple mb-1">15+</p>
                <p className="text-sm text-gray-400">专辑奖项</p>
              </div>
            </div>
          </motion.div>

          {/* 社会影响 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="bg-secondary-dark rounded-xl border border-wangfeng-purple/30 shadow-glow p-8"
          >
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-wangfeng-purple" />
              社会影响
            </h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">音乐影响力</h4>
                <p className="text-gray-200 leading-relaxed">{artistBio.socialImpact.musicInfluence}</p>
              </div>
              
              <div>
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">文化贡献</h4>
                <p className="text-gray-200 leading-relaxed">{artistBio.socialImpact.culturalContribution}</p>
              </div>
              
              <div>
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">艺术追求</h4>
                <p className="text-gray-200 leading-relaxed">{artistBio.socialImpact.artisticPursuit}</p>
              </div>
              
              <div>
                <h4 className="text-xl font-semibold text-wangfeng-purple mb-3">跨界成就</h4>
                <p className="text-gray-200 leading-relaxed">{artistBio.socialImpact.crossFieldAchievement}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;