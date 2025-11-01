import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const Quotes = () => {
  const wangfengQuotes = [
    {
      text: "怒放的生命，就像飞翔在辽阔天空",
      context: "经典歌曲《怒放的生命》"
    },
    {
      text: "春天里，我埋下一颗种子，终会有巨大的收获",
      context: "经典歌曲《春天里》"
    },
    {
      text: "当我和世界不一样，那就让我不一样",
      context: "音乐理念"
    },
    {
      text: "摇滚是一种态度，是对生命的热爱",
      context: "音乐感悟"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block">
            <motion.h1
              className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4 relative z-10"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              经典 <span className="text-wangfeng-purple">语录</span>
            </motion.h1>
            <motion.div
              className="absolute -top-4 -right-4 text-wangfeng-purple/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple mb-6">
            汪峰的智慧箴言
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {wangfengQuotes.map((quote, index) => (
              <motion.div
                key={`quote-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="theme-bg-card rounded-xl border theme-border-primary shadow-glow p-8"
              >
                <blockquote className="theme-text-primary text-center font-serif italic text-lg md:text-xl relative">
                  <span className="text-wangfeng-purple font-bold text-3xl absolute -top-4 -left-4">"</span>
                  {quote.text}
                  <span className="text-wangfeng-purple font-bold text-3xl absolute -bottom-4 -right-4">"</span>
                </blockquote>
                <p className="text-center text-purple-400 text-sm mt-4 font-bebas tracking-wider">
                  - {quote.context}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quotes;