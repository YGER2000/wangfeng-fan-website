import { motion } from 'framer-motion';
import { Heart, Code, Users, Globe, Star, Coffee } from 'lucide-react';

const AboutSite = () => {
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
            关于 <span className="text-wangfeng-purple animate-pulse-glow">本站</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰终极粉丝网站
          </h2>
          <p className="theme-text-secondary text-lg max-w-2xl mx-auto">
            一个由汪峰粉丝创建和维护的非官方网站，致力于记录和分享汪峰的音乐世界
          </p>
        </motion.div>

        {/* 网站介绍 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-8 mb-12"
        >
          <div className="prose prose-invert max-w-none">
            <h2 className="text-3xl font-bold theme-text-primary mb-6 flex items-center gap-3">
              <Globe className="w-8 h-8 text-wangfeng-purple" />
              网站简介
            </h2>
            
            <p className="theme-text-secondary text-lg leading-relaxed mb-6">
              欢迎来到汪峰终极粉丝网站！这是一个由热爱汪峰音乐的粉丝们自发创建和维护的非官方网站。
              我们的目标是为所有喜欢汪峰音乐的朋友提供一个全面、专业、易于浏览的信息平台。
            </p>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold theme-text-primary mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-wangfeng-purple" />
                  我们的使命
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">记录汪峰完整的音乐生涯和成就</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">分享最新的演出信息和新闻动态</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">建立一个活跃的粉丝社区</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">传播摇滚精神和音乐文化</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold theme-text-primary mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-wangfeng-purple" />
                  我们的特色
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">全面的音乐作品数据库</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">详细的演出时间线和行程信息</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">丰富的图片和视频资源</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">粉丝互动和内容分享平台</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-wangfeng-purple/10 border border-wangfeng-purple/30 rounded-lg p-6">
              <h3 className="text-xl font-bold theme-text-primary mb-3 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-wangfeng-purple" />
                网站声明
              </h3>
              <p className="theme-text-secondary">
                本站为非官方粉丝网站，所有内容仅供学习和交流使用。我们尊重并支持正版音乐，
                鼓励大家通过官方渠道支持汪峰的音乐作品。如有任何版权问题，请与我们联系。
              </p>
            </div>
          </div>
        </motion.div>

        {/* 开发团队 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-8 mb-12"
        >
          <h2 className="text-3xl font-bold theme-text-primary mb-6 flex items-center gap-3">
            <Code className="w-8 h-8 text-wangfeng-purple" />
            技术实现
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 rounded-lg border theme-border-primary">
              <div className="w-16 h-16 bg-wangfeng-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="w-8 h-8 text-wangfeng-purple" />
              </div>
              <h3 className="text-xl font-bold theme-text-primary mb-2">前端技术</h3>
              <p className="theme-text-secondary text-sm">
                使用React、TypeScript和Tailwind CSS构建，确保流畅的用户体验
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border theme-border-primary">
              <div className="w-16 h-16 bg-wangfeng-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-wangfeng-purple" />
              </div>
              <h3 className="text-xl font-bold theme-text-primary mb-2">后端技术</h3>
              <p className="theme-text-secondary text-sm">
                基于Python Flask框架构建RESTful API，提供稳定的数据服务
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border theme-border-primary">
              <div className="w-16 h-16 bg-wangfeng-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-wangfeng-purple" />
              </div>
              <h3 className="text-xl font-bold theme-text-primary mb-2">社区驱动</h3>
              <p className="theme-text-secondary text-sm">
                开源项目，欢迎更多粉丝贡献内容和代码
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="theme-text-secondary mb-4">
              如果您对网站开发感兴趣，欢迎访问我们的GitHub仓库参与开发
            </p>
            <a 
              href="https://github.com/YGER2000/wangfeng-fan-website" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-wangfeng-purple text-white rounded-lg font-semibold hover:bg-wangfeng-purple/80 transition-colors"
            >
              <Code className="w-5 h-5" />
              查看源代码
            </a>
          </div>
        </motion.div>

        {/* 致谢 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-8"
        >
          <h2 className="text-3xl font-bold theme-text-primary mb-6 flex items-center gap-3">
            <Users className="w-8 h-8 text-wangfeng-purple" />
            致谢
          </h2>
          
          <div className="prose prose-invert max-w-none">
            <p className="theme-text-secondary text-lg mb-6">
              感谢所有为这个网站贡献内容、提出建议和报告问题的粉丝朋友们。
              正是有了大家的支持和参与，这个网站才能不断完善和发展。
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold theme-text-primary mb-4">特别感谢</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">所有贡献内容的粉丝作者</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">提供技术支持的开发者</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-wangfeng-purple rounded-full mt-2 flex-shrink-0"></div>
                    <span className="theme-text-secondary">积极反馈和建议的用户</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold theme-text-primary mb-4">联系我们</h3>
                <p className="theme-text-secondary mb-4">
                  如果您有任何建议、意见或想参与网站建设，欢迎通过以下方式联系我们：
                </p>
                <div className="space-y-2">
                  <p className="theme-text-secondary flex items-center gap-2">
                    <span className="text-wangfeng-purple">📧</span>
                    <span>admin@wangfengfans.com</span>
                  </p>
                  <p className="theme-text-secondary flex items-center gap-2">
                    <span className="text-wangfeng-purple">💬</span>
                    <span>通过网站反馈功能提交</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8 pt-6 border-t theme-border-primary">
              <p className="theme-text-secondary italic">
                "摇滚精神永不灭!" - 让我们一起感受峰，感受存在！
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutSite;