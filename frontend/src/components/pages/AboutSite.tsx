import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Heart, Code, Users, Globe, Star, Coffee, Sparkles, Rocket, Zap, Shield, Music2, Database, Layers } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface GuestbookMessage {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

const GUESTBOOK_STORAGE_KEY = 'wangfeng_about_guestbook';

const MessageBoard = ({ isLight }: { isLight: boolean }) => {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('加载留言失败', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.warn('保存留言失败', err);
    }
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      setError('留言内容不能为空');
      return;
    }

    const newMessage: GuestbookMessage = {
      id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
      author: author.trim() || '匿名峰迷',
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [newMessage, ...prev]);
    setAuthor('');
    setContent('');
    setError(null);
  };

  const handleDelete = (messageId: string) => {
    setMessages(prev => prev.filter(message => message.id !== messageId));
  };

  return (
    <div className={cn(
      'rounded-3xl border p-6 md:p-8 mb-16',
      isLight ? 'bg-white border-gray-200 shadow-xl' : 'bg-black/40 border-wangfeng-purple/30 backdrop-blur'
    )}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className={cn(
            'text-3xl font-bold',
            isLight ? 'text-gray-900' : 'text-white'
          )}>
            留言板
          </h2>
          <p className={cn(
            'text-sm mt-1',
            isLight ? 'text-gray-500' : 'text-gray-400'
          )}>
            暂存于本地，仅供测试体验，所有人都可以留言与删除。
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              isLight ? 'text-gray-700' : 'text-gray-300'
            )}>
              昵称（可选）
            </label>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="匿名峰迷"
              className={cn(
                'w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-colors',
                isLight
                  ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                  : 'bg-black/50 border-wangfeng-purple/30 text-white focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
              )}
            />
          </div>
          <div className="md:col-span-2">
            <label className={cn(
              'block text-sm font-medium mb-2',
              isLight ? 'text-gray-700' : 'text-gray-300'
            )}>
              想对本站说的话
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="输入留言内容"
              rows={3}
              className={cn(
                'w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 transition-colors resize-none',
                isLight
                  ? 'bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
                  : 'bg-black/50 border-wangfeng-purple/30 text-white focus:border-wangfeng-purple focus:ring-wangfeng-purple/20'
              )}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 rounded-xl bg-wangfeng-purple text-white font-medium hover:bg-wangfeng-purple/90 transition-colors"
          >
            发布留言
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className={cn(
            'text-center text-sm py-6 rounded-2xl border border-dashed',
            isLight ? 'text-gray-400 border-gray-200' : 'text-gray-500 border-wangfeng-purple/30'
          )}>
            还没有留言，快来留下第一条吧！
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'rounded-2xl border p-4 md:p-5 flex flex-col gap-2',
                isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-wangfeng-purple/20'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className={cn(
                    'font-semibold',
                    isLight ? 'text-gray-900' : 'text-white'
                  )}>
                    {message.author}
                  </p>
                  <p className={cn(
                    'text-xs',
                    isLight ? 'text-gray-500' : 'text-gray-400'
                  )}>
                    {new Date(message.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(message.id)}
                  className={cn(
                    'text-xs px-3 py-1 rounded-full border transition-colors',
                    isLight
                      ? 'text-red-500 border-red-200 hover:bg-red-50'
                      : 'text-red-300 border-red-500/40 hover:bg-red-500/10'
                  )}
                >
                  删除
                </button>
              </div>
              <p className={cn(
                'text-sm leading-relaxed',
                isLight ? 'text-gray-700' : 'text-gray-300'
              )}>
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AboutSite = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  return (
    <div className={cn(
      "min-h-screen py-20 transition-colors duration-300",
      isLight ? "bg-white text-gray-900" : "bg-transparent text-white"
    )}>
      <div className="container mx-auto px-4 max-w-7xl">
        <MessageBoard isLight={isLight} />

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
              关于 <span className="text-wangfeng-purple">本站</span>
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
            "text-xl md:text-2xl font-light tracking-[0.3em] uppercase mb-4",
            isLight ? "text-gray-600" : "text-gray-300"
          )}>
            汪峰终极粉丝网站
          </h2>
          <p className={cn(
            "text-lg max-w-2xl mx-auto leading-relaxed",
            isLight ? "text-gray-600" : "text-gray-400"
          )}>
            一个由汪峰粉丝创建和维护的非官方网站，致力于记录和分享汪峰的音乐世界
          </p>
        </motion.div>

        {/* Stats Cards - Bold Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
        >
          {[
            { icon: Music2, number: "15+", label: "专辑收录", color: "text-wangfeng-purple" },
            { icon: Globe, number: "500+", label: "演出记录", color: "text-blue-500" },
            { icon: Users, number: "1000+", label: "活跃粉丝", color: "text-pink-500" },
            { icon: Heart, number: "∞", label: "音乐热爱", color: "text-red-500" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
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

        {/* Featured Intro Card - Modern Asymmetric Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-20"
        >
          <div className={cn(
            "rounded-3xl overflow-hidden border transition-all",
            isLight
              ? "bg-gradient-to-br from-gray-50 to-white border-gray-200 shadow-xl"
              : "bg-gradient-to-br from-black/60 to-black/40 border-wangfeng-purple/40 shadow-glow"
          )}>
            <div className="p-8 lg:p-12">
              <div className="flex items-center gap-4 mb-8">
                <Globe className="w-10 h-10 text-wangfeng-purple" />
                <h3 className={cn(
                  "text-4xl md:text-5xl font-bold",
                  isLight ? "text-gray-900" : "text-white"
                )}>网站简介</h3>
              </div>

              <p className={cn(
                "text-lg leading-relaxed mb-10",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                欢迎来到汪峰终极粉丝网站！这是一个由热爱汪峰音乐的粉丝们自发创建和维护的非官方网站。
                我们的目标是为所有喜欢汪峰音乐的朋友提供一个全面、专业、易于浏览的信息平台。
              </p>

              <div className="grid md:grid-cols-2 gap-10">
                {/* Mission */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-wangfeng-purple/20 flex items-center justify-center">
                      <Star className="w-6 h-6 text-wangfeng-purple" />
                    </div>
                    <h4 className={cn(
                      "text-2xl font-bold",
                      isLight ? "text-gray-900" : "text-white"
                    )}>我们的使命</h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "记录汪峰完整的音乐生涯和成就",
                      "分享最新的演出信息和新闻动态",
                      "建立一个活跃的粉丝社区",
                      "传播摇滚精神和音乐文化"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                        <span className={cn(
                          "text-base",
                          isLight ? "text-gray-700" : "text-gray-300"
                        )}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-pink-500" />
                    </div>
                    <h4 className={cn(
                      "text-2xl font-bold",
                      isLight ? "text-gray-900" : "text-white"
                    )}>我们的特色</h4>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "全面的音乐作品数据库",
                      "详细的演出时间线和行程信息",
                      "丰富的图片和视频资源",
                      "粉丝互动和内容分享平台"
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className={cn(
                          "text-base",
                          isLight ? "text-gray-700" : "text-gray-300"
                        )}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Disclaimer */}
              <div className={cn(
                "mt-10 rounded-2xl p-6 border",
                isLight
                  ? "bg-purple-50 border-purple-200"
                  : "bg-wangfeng-purple/10 border-wangfeng-purple/30"
              )}>
                <div className="flex items-start gap-4">
                  <Shield className="w-6 h-6 text-wangfeng-purple flex-shrink-0 mt-1" />
                  <div>
                    <h5 className={cn(
                      "text-lg font-bold mb-2",
                      isLight ? "text-gray-900" : "text-white"
                    )}>网站声明</h5>
                    <p className={cn(
                      "text-sm leading-relaxed",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>
                      本站为非官方粉丝网站，所有内容仅供学习和交流使用。我们尊重并支持正版音乐，
                      鼓励大家通过官方渠道支持汪峰的音乐作品。如有任何版权问题，请与我们联系。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tech Stack - Modern Split Screen */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-12">
            <Code className="w-10 h-10 text-wangfeng-purple" />
            <h3 className={cn(
              "text-4xl md:text-5xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>技术实现</h3>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Frontend */}
            <div className={cn(
              "rounded-3xl p-8 md:p-10 border transition-all",
              isLight
                ? "bg-gradient-to-br from-blue-50 to-white border-blue-200"
                : "bg-gradient-to-br from-blue-500/10 to-black/40 border-blue-500/40"
            )}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Layers className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h4 className={cn(
                    "text-2xl font-bold",
                    isLight ? "text-gray-900" : "text-white"
                  )}>前端技术</h4>
                  <p className={cn(
                    "text-sm",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>Modern Frontend Stack</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "React 18", desc: "现代化的用户界面框架" },
                  { label: "TypeScript", desc: "类型安全的开发体验" },
                  { label: "Tailwind CSS", desc: "快速构建精美界面" },
                  { label: "Framer Motion", desc: "流畅的动画效果" },
                  { label: "Vite", desc: "极速的开发构建工具" }
                ].map((tech, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border transition-all hover:scale-[1.02]",
                    isLight
                      ? "bg-white border-blue-200 hover:border-blue-400"
                      : "bg-black/30 border-blue-500/30 hover:border-blue-500/60"
                  )}>
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <h5 className={cn(
                          "font-bold text-sm",
                          isLight ? "text-gray-900" : "text-white"
                        )}>{tech.label}</h5>
                        <p className={cn(
                          "text-xs",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>{tech.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div className={cn(
              "rounded-3xl p-8 md:p-10 border transition-all",
              isLight
                ? "bg-gradient-to-br from-green-50 to-white border-green-200"
                : "bg-gradient-to-br from-green-500/10 to-black/40 border-green-500/40"
            )}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Database className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h4 className={cn(
                    "text-2xl font-bold",
                    isLight ? "text-gray-900" : "text-white"
                  )}>后端技术</h4>
                  <p className={cn(
                    "text-sm",
                    isLight ? "text-gray-600" : "text-gray-400"
                  )}>Robust Backend Stack</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "FastAPI", desc: "高性能的 Python API 框架" },
                  { label: "MySQL", desc: "可靠的关系型数据库" },
                  { label: "SQLAlchemy", desc: "强大的 ORM 工具" },
                  { label: "Pydantic", desc: "数据验证与类型检查" },
                  { label: "JWT Auth", desc: "安全的身份认证系统" }
                ].map((tech, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border transition-all hover:scale-[1.02]",
                    isLight
                      ? "bg-white border-green-200 hover:border-green-400"
                      : "bg-black/30 border-green-500/30 hover:border-green-500/60"
                  )}>
                    <div className="flex items-center gap-3">
                      <Rocket className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div>
                        <h5 className={cn(
                          "font-bold text-sm",
                          isLight ? "text-gray-900" : "text-white"
                        )}>{tech.label}</h5>
                        <p className={cn(
                          "text-xs",
                          isLight ? "text-gray-600" : "text-gray-400"
                        )}>{tech.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Open Source CTA */}
          <div className={cn(
            "mt-8 rounded-2xl p-8 border text-center transition-all",
            isLight
              ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
              : "bg-gradient-to-r from-wangfeng-purple/10 to-pink-500/10 border-wangfeng-purple/30"
          )}>
            <Users className="w-12 h-12 mx-auto mb-4 text-wangfeng-purple" />
            <h4 className={cn(
              "text-2xl font-bold mb-3",
              isLight ? "text-gray-900" : "text-white"
            )}>开源社区驱动</h4>
            <p className={cn(
              "text-base mb-6 max-w-2xl mx-auto",
              isLight ? "text-gray-700" : "text-gray-300"
            )}>
              本项目采用开源方式开发，欢迎所有热爱汪峰音乐的粉丝和开发者参与贡献。
              一起打造更好的粉丝社区平台！
            </p>
            <a
              href="https://github.com/YGER2000/wangfeng-fan-website"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-wangfeng-purple text-white rounded-xl font-semibold hover:bg-wangfeng-purple/80 transition-all hover:scale-105 shadow-lg"
            >
              <Code className="w-5 h-5" />
              查看源代码
            </a>
          </div>
        </motion.div>

        {/* Acknowledgments - Full Width Feature */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className={cn(
            "rounded-3xl p-10 md:p-12 border",
            isLight
              ? "bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 border-pink-200"
              : "bg-gradient-to-br from-pink-500/10 via-wangfeng-purple/10 to-blue-500/10 border-wangfeng-purple/40"
          )}
        >
          <div className="flex items-center gap-4 mb-12">
            <Heart className="w-10 h-10 text-pink-500" />
            <h3 className={cn(
              "text-4xl md:text-5xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>致谢与联系</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-10">
            {/* Thanks */}
            <div>
              <h4 className={cn(
                "text-2xl font-bold mb-6",
                isLight ? "text-gray-900" : "text-white"
              )}>特别感谢</h4>
              <p className={cn(
                "text-base mb-6 leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                感谢所有为这个网站贡献内容、提出建议和报告问题的粉丝朋友们。
                正是有了大家的支持和参与，这个网站才能不断完善和发展。
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Star, text: "所有贡献内容的粉丝作者" },
                  { icon: Code, text: "提供技术支持的开发者" },
                  { icon: Heart, text: "积极反馈和建议的用户" },
                  { icon: Music2, text: "分享资源的音乐爱好者" }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      isLight ? "bg-purple-100" : "bg-wangfeng-purple/20"
                    )}>
                      <item.icon className="w-5 h-5 text-wangfeng-purple" />
                    </div>
                    <span className={cn(
                      "text-base mt-2",
                      isLight ? "text-gray-700" : "text-gray-300"
                    )}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className={cn(
                "text-2xl font-bold mb-6",
                isLight ? "text-gray-900" : "text-white"
              )}>联系我们</h4>
              <p className={cn(
                "text-base mb-6 leading-relaxed",
                isLight ? "text-gray-700" : "text-gray-300"
              )}>
                如果您有任何建议、意见或想参与网站建设，欢迎通过以下方式联系我们：
              </p>
              <div className="space-y-4">
                {[
                  { emoji: "📧", label: "邮箱", value: "admin@wangfengfans.com" },
                  { emoji: "💬", label: "反馈", value: "通过网站反馈功能提交" },
                  { emoji: "🐙", label: "GitHub", value: "提交 Issue 或 PR" },
                  { emoji: "🎸", label: "社区", value: "加入粉丝社区讨论" }
                ].map((contact, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border",
                    isLight
                      ? "bg-white border-pink-200"
                      : "bg-black/30 border-pink-500/30"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{contact.emoji}</span>
                      <div>
                        <p className={cn(
                          "text-xs font-semibold mb-1",
                          isLight ? "text-gray-500" : "text-gray-400"
                        )}>{contact.label}</p>
                        <p className={cn(
                          "text-sm font-medium",
                          isLight ? "text-gray-900" : "text-white"
                        )}>{contact.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className={cn(
            "text-center pt-8 border-t",
            isLight ? "border-gray-200" : "border-wangfeng-purple/20"
          )}>
            <p className={cn(
              "text-2xl md:text-3xl font-bold italic mb-3",
              isLight ? "text-gray-900" : "text-wangfeng-purple"
            )}>
              "摇滚精神永不灭!"
            </p>
            <p className={cn(
              "text-base",
              isLight ? "text-gray-600" : "text-gray-400"
            )}>
              让我们一起感受峰，感受存在！
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutSite;
