import { motion } from 'framer-motion';
import { Calendar, MapPin, GraduationCap, Music, Award, BookOpen, Heart, Sparkles, Trophy, Star } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

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
  const { theme } = useTheme();
  const isLight = theme === 'white';

  // Static artist bio data
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

  return (
    <div className={cn(
      "min-h-screen py-20 transition-colors duration-300",
      isLight ? "bg-white text-gray-900" : "bg-transparent text-white"
    )}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section - Bold Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="relative inline-block">
            <motion.h1
              className={cn(
                "text-5xl md:text-7xl font-bebas tracking-wider mb-6 relative z-10",
                isLight ? "text-gray-900" : "text-white"
              )}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              关于 <span className="text-wangfeng-purple">汪峰</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className={cn(
            "text-xl md:text-2xl font-light tracking-[0.3em] uppercase",
            isLight ? "text-gray-600" : "text-gray-300"
          )}>
            Rock Legend · 摇滚诗人
          </h2>
        </motion.div>

        {/* Featured Bio Card - Modern Asymmetric Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-20"
        >
          <div className={cn(
            "rounded-3xl overflow-hidden border transition-all",
            isLight
              ? "bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-xl"
              : "bg-gradient-to-br from-black/60 to-black/40 border-wangfeng-purple/40 shadow-glow"
          )}>
            <div className="grid lg:grid-cols-5 gap-0">
              {/* Image Section - Takes 2 columns */}
              <div className="lg:col-span-2 relative overflow-hidden">
                <div className="aspect-square lg:aspect-auto lg:h-full">
                  <img
                    src="/images/wangfeng.JPG"
                    alt={artistBio.basicInfo.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/wangfeng.jpg';
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className={cn(
                    "absolute inset-0",
                    isLight
                      ? "bg-gradient-to-t from-gray-50 via-transparent to-transparent"
                      : "bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                  )}></div>
                </div>
              </div>

              {/* Content Section - Takes 3 columns */}
              <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-6 h-6 text-wangfeng-purple" />
                  <span className={cn(
                    "text-sm font-semibold tracking-widest uppercase",
                    isLight ? "text-gray-600" : "text-wangfeng-purple"
                  )}>Artist Profile</span>
                </div>

                <h2 className={cn(
                  "text-5xl font-bold mb-4",
                  isLight ? "text-gray-900" : "text-white"
                )}>
                  {artistBio.basicInfo.name}
                </h2>

                {/* Info Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Calendar className={cn(
                      "w-5 h-5 mt-1 flex-shrink-0",
                      isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium mb-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>出生日期</p>
                      <p className={cn(
                        "text-sm font-medium",
                        isLight ? "text-gray-900" : "text-gray-200"
                      )}>{artistBio.basicInfo.birthDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className={cn(
                      "w-5 h-5 mt-1 flex-shrink-0",
                      isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium mb-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>出生地</p>
                      <p className={cn(
                        "text-sm font-medium",
                        isLight ? "text-gray-900" : "text-gray-200"
                      )}>{artistBio.basicInfo.birthPlace}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <GraduationCap className={cn(
                      "w-5 h-5 mt-1 flex-shrink-0",
                      isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium mb-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>毕业院校</p>
                      <p className={cn(
                        "text-sm font-medium",
                        isLight ? "text-gray-900" : "text-gray-200"
                      )}>{artistBio.basicInfo.education}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Music className={cn(
                      "w-5 h-5 mt-1 flex-shrink-0",
                      isLight ? "text-wangfeng-purple" : "text-wangfeng-purple"
                    )} />
                    <div>
                      <p className={cn(
                        "text-xs font-medium mb-1",
                        isLight ? "text-gray-500" : "text-gray-400"
                      )}>职业</p>
                      <p className={cn(
                        "text-sm font-medium",
                        isLight ? "text-gray-900" : "text-gray-200"
                      )}>{artistBio.basicInfo.occupation.join(' · ')}</p>
                    </div>
                  </div>
                </div>

                <p className={cn(
                  "text-base leading-relaxed",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  {artistBio.mainBiography}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards - Bold Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {[
            { icon: Trophy, number: "80+", label: "获奖记录", color: "text-yellow-500" },
            { icon: Music, number: "15+", label: "专辑作品", color: "text-wangfeng-purple" },
            { icon: Star, number: "30+", label: "年音乐生涯", color: "text-blue-500" },
            { icon: Award, number: "25+", label: "金曲作品", color: "text-pink-500" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              className={cn(
                "rounded-2xl p-6 text-center border transition-all hover:scale-105",
                isLight
                  ? "bg-white border-gray-200 shadow-lg hover:shadow-xl"
                  : "bg-black/40 border-wangfeng-purple/30 hover:border-wangfeng-purple/60"
              )}
            >
              <stat.icon className={cn("w-10 h-10 mx-auto mb-3", stat.color)} />
              <div className={cn(
                "text-4xl font-bold mb-2",
                isLight ? "text-gray-900" : "text-white"
              )}>{stat.number}</div>
              <div className={cn(
                "text-sm font-medium",
                isLight ? "text-gray-600" : "text-gray-400"
              )}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Career Timeline - Modern Vertical Design */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-12">
            <Award className="w-10 h-10 text-wangfeng-purple" />
            <h3 className={cn(
              "text-4xl md:text-5xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>职业生涯里程碑</h3>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className={cn(
              "absolute left-8 md:left-12 top-0 bottom-0 w-1",
              isLight ? "bg-gradient-to-b from-wangfeng-purple via-purple-300 to-wangfeng-purple" : "bg-gradient-to-b from-wangfeng-purple via-wangfeng-purple/50 to-wangfeng-purple"
            )}></div>

            {artistBio.careerTimeline.map((milestone, index) => (
              <motion.div
                key={`timeline-${index}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="relative pl-20 md:pl-28 pb-12 last:pb-0"
              >
                {/* Year Badge */}
                <div className="absolute left-0 top-0">
                  <div className={cn(
                    "w-16 md:w-24 h-16 md:h-24 rounded-2xl flex items-center justify-center font-bold text-lg md:text-xl border-4 transition-all",
                    isLight
                      ? "bg-white border-wangfeng-purple text-wangfeng-purple shadow-lg"
                      : "bg-black border-wangfeng-purple text-wangfeng-purple"
                  )}>
                    {milestone.year}
                  </div>
                </div>

                {/* Content Card */}
                <div className={cn(
                  "rounded-2xl p-6 md:p-8 border transition-all hover:scale-[1.02]",
                  isLight
                    ? "bg-white border-gray-200 shadow-md hover:shadow-xl"
                    : "bg-black/40 border-wangfeng-purple/30 hover:border-wangfeng-purple/60"
                )}>
                  <h4 className={cn(
                    "text-2xl font-bold mb-3",
                    isLight ? "text-gray-900" : "text-white"
                  )}>{milestone.event}</h4>
                  <p className={cn(
                    "text-base leading-relaxed",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Music Style & Personal Life - Split Screen */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="grid lg:grid-cols-2 gap-8 mb-20"
        >
          {/* Music Style */}
          <div className={cn(
            "rounded-3xl p-8 md:p-10 border transition-all",
            isLight
              ? "bg-gradient-to-br from-purple-50 to-white border-purple-200"
              : "bg-gradient-to-br from-wangfeng-purple/10 to-black/40 border-wangfeng-purple/40"
          )}>
            <div className="flex items-center gap-4 mb-8">
              <Music className="w-10 h-10 text-wangfeng-purple" />
              <h3 className={cn(
                "text-3xl font-bold",
                isLight ? "text-gray-900" : "text-white"
              )}>音乐风格</h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-3",
                  isLight ? "text-gray-700" : "text-wangfeng-purple"
                )}>音乐类型</h4>
                <div className="flex flex-wrap gap-2">
                  {artistBio.musicalStyle.genres.map((genre, index) => (
                    <span
                      key={index}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105",
                        isLight
                          ? "bg-wangfeng-purple text-white border-wangfeng-purple shadow-md"
                          : "bg-wangfeng-purple/20 text-wangfeng-purple border-wangfeng-purple/50"
                      )}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-3",
                  isLight ? "text-gray-700" : "text-wangfeng-purple"
                )}>音乐特色</h4>
                <ul className="space-y-3">
                  {artistBio.musicalStyle.characteristics.map((char, index) => (
                    <li key={`characteristic-${index}`} className={cn(
                      "flex items-start gap-3 text-sm",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-3",
                  isLight ? "text-gray-700" : "text-wangfeng-purple"
                )}>风格演进</h4>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>{artistBio.musicalStyle.evolution}</p>
              </div>
            </div>
          </div>

          {/* Personal Life */}
          <div className={cn(
            "rounded-3xl p-8 md:p-10 border transition-all",
            isLight
              ? "bg-gradient-to-br from-pink-50 to-white border-pink-200"
              : "bg-gradient-to-br from-pink-500/10 to-black/40 border-pink-500/40"
          )}>
            <div className="flex items-center gap-4 mb-8">
              <Heart className="w-10 h-10 text-pink-500" />
              <h3 className={cn(
                "text-3xl font-bold",
                isLight ? "text-gray-900" : "text-white"
              )}>个人生活</h3>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-2",
                  isLight ? "text-gray-700" : "text-pink-400"
                )}>教育背景</h4>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>{artistBio.personalLife.education}</p>
              </div>

              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-2",
                  isLight ? "text-gray-700" : "text-pink-400"
                )}>创作理念</h4>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>{artistBio.personalLife.creativePhilosophy}</p>
              </div>

              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-2",
                  isLight ? "text-gray-700" : "text-pink-400"
                )}>文学追求</h4>
                <p className={cn(
                  "text-sm leading-relaxed",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>{artistBio.personalLife.literaryPursuit}</p>
              </div>

              <div>
                <h4 className={cn(
                  "text-lg font-semibold mb-3",
                  isLight ? "text-gray-700" : "text-pink-400"
                )}>兴趣爱好</h4>
                <div className="flex flex-wrap gap-2">
                  {artistBio.personalLife.interests.map((interest, index) => (
                    <span
                      key={index}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border",
                        isLight
                          ? "bg-pink-100 text-pink-700 border-pink-200"
                          : "bg-pink-500/20 text-pink-300 border-pink-500/30"
                      )}
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements - Showcase Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-12">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h3 className={cn(
              "text-4xl md:text-5xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>主要成就</h3>
          </div>

          <div className="space-y-6">
            {artistBio.achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                className={cn(
                  "rounded-2xl p-8 border transition-all hover:scale-[1.02]",
                  isLight
                    ? "bg-white border-gray-200 shadow-lg hover:shadow-xl"
                    : "bg-black/40 border-yellow-500/30 hover:border-yellow-500/60"
                )}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-shrink-0 text-center md:text-left">
                    <div className={cn(
                      "text-5xl font-bold mb-2",
                      isLight ? "text-wangfeng-purple" : "text-yellow-500"
                    )}>{achievement.year}</div>
                    <div className={cn(
                      "text-sm font-medium",
                      isLight ? "text-gray-500" : "text-gray-400"
                    )}>{achievement.category}</div>
                  </div>
                  <div className="flex-1">
                    <h4 className={cn(
                      "text-2xl font-bold mb-2",
                      isLight ? "text-gray-900" : "text-white"
                    )}>{achievement.award}</h4>
                    {achievement.album && (
                      <p className="text-wangfeng-purple text-sm font-medium mb-2">专辑：《{achievement.album}》</p>
                    )}
                    <p className={cn(
                      "text-sm",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>{achievement.significance}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Awards Stats */}
          <div className={cn(
            "rounded-2xl p-8 mt-8 border",
            isLight
              ? "bg-gradient-to-r from-yellow-50 to-purple-50 border-yellow-200"
              : "bg-gradient-to-r from-yellow-500/10 to-wangfeng-purple/10 border-yellow-500/30"
          )}>
            <h4 className={cn(
              "text-2xl font-bold mb-6 text-center",
              isLight ? "text-gray-900" : "text-white"
            )}>完整获奖统计</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: "80+", label: "获奖记录" },
                { number: "30+", label: "个人奖项" },
                { number: "25+", label: "歌曲奖项" },
                { number: "15+", label: "专辑奖项" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className={cn(
                    "text-4xl font-bold mb-2",
                    isLight ? "text-wangfeng-purple" : "text-yellow-500"
                  )}>{stat.number}</p>
                  <p className={cn(
                    "text-sm font-medium",
                    isLight ? "text-gray-700" : "text-gray-400"
                  )}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Social Impact - Full Width Feature */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className={cn(
            "rounded-3xl p-10 md:p-12 border",
            isLight
              ? "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-200"
              : "bg-gradient-to-br from-blue-500/10 via-wangfeng-purple/10 to-pink-500/10 border-wangfeng-purple/40"
          )}
        >
          <div className="flex items-center gap-4 mb-12">
            <BookOpen className="w-10 h-10 text-blue-500" />
            <h3 className={cn(
              "text-4xl md:text-5xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>社会影响</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className={cn(
                "text-xl font-bold mb-3 flex items-center gap-2",
                isLight ? "text-gray-900" : "text-blue-400"
              )}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                音乐影响力
              </h4>
              <p className={cn(
                "leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>{artistBio.socialImpact.musicInfluence}</p>
            </div>

            <div>
              <h4 className={cn(
                "text-xl font-bold mb-3 flex items-center gap-2",
                isLight ? "text-gray-900" : "text-purple-400"
              )}>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                文化贡献
              </h4>
              <p className={cn(
                "leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>{artistBio.socialImpact.culturalContribution}</p>
            </div>

            <div>
              <h4 className={cn(
                "text-xl font-bold mb-3 flex items-center gap-2",
                isLight ? "text-gray-900" : "text-pink-400"
              )}>
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                艺术追求
              </h4>
              <p className={cn(
                "leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>{artistBio.socialImpact.artisticPursuit}</p>
            </div>

            <div>
              <h4 className={cn(
                "text-xl font-bold mb-3 flex items-center gap-2",
                isLight ? "text-gray-900" : "text-yellow-400"
              )}>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                跨界成就
              </h4>
              <p className={cn(
                "leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>{artistBio.socialImpact.crossFieldAchievement}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
