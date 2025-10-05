import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, ThumbsUp } from 'lucide-react';
import { LikeButton } from '../ui/LikeButton';
import { CommentSection } from '../ui/CommentSection';

const CommentDemo = () => {
  return (
    <div className="min-h-screen text-white py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            评论和点赞功能演示
          </h1>
          <p className="text-lg text-gray-300">
            这是一个演示页面，展示汪峰粉丝网站的评论和点赞功能
          </p>
        </motion.div>

        {/* 演示文章 */}
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900/30 rounded-lg border border-gray-700 p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            汪峰：音乐路上的坚持与突破
          </h2>
          
          <div className="prose prose-lg prose-invert max-w-none mb-6">
            <p className="text-gray-300 leading-relaxed">
              从早期的鲍家街43号到后来的个人音乐生涯，汪峰始终在音乐的道路上坚持着自己的理念。
              他的歌曲不仅仅是旋律的堆砌，更是对生活、对社会、对人性的深刻思考。
            </p>
            
            <p className="text-gray-300 leading-relaxed">
              《春天里》、《北京北京》、《存在》等经典作品，每一首都承载着他对这个时代的观察和感悟。
              他用音乐讲述着普通人的故事，用歌声传递着正能量。
            </p>

            <p className="text-gray-300 leading-relaxed">
              在中国摇滚乐的发展历程中，汪峰无疑是一个重要的里程碑。他不仅创作了众多脍炙人口的作品，
              更是将摇滚乐带向了更广阔的舞台，让更多的人能够感受到摇滚乐的魅力。
            </p>
          </div>

          {/* 点赞区域 */}
          <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-600 mb-6">
            <div className="flex items-center space-x-3">
              <ThumbsUp className="text-wangfeng-purple" size={20} />
              <span className="text-gray-300">如果这篇文章让你有所感悟，请点个赞吧！</span>
            </div>
            <LikeButton 
              postId="demo-article-1" 
              showCount={true} 
              showRecentUsers={true}
            />
          </div>

          {/* 文章标签 */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-wangfeng-purple/20 text-wangfeng-purple rounded-full text-sm">
              汪峰
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              摇滚音乐
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
              音乐人生
            </span>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
              经典歌曲
            </span>
          </div>
        </motion.article>

        {/* 其他演示文章卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          <div className="bg-gray-900/30 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-3">
              《春天里》背后的故事
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              这首歌创作于2009年，灵感来源于对生活的感悟...
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">2小时前</div>
              <LikeButton postId="demo-article-2" showCount={true} />
            </div>
          </div>

          <div className="bg-gray-900/30 rounded-lg border border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-white mb-3">
              演唱会现场的震撼时刻
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              在万人体育场里，汪峰的歌声响彻云霄...
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">5小时前</div>
              <LikeButton postId="demo-article-3" showCount={true} />
            </div>
          </div>
        </motion.div>

        {/* 评论区 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CommentSection 
            postId="demo-article-1"
            title="文章讨论"
            className="bg-gray-900/30 rounded-lg border border-gray-700 p-6"
          />
        </motion.div>

        {/* 功能说明 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 bg-wangfeng-purple/10 border border-wangfeng-purple/30 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-wangfeng-purple mb-4 flex items-center gap-2">
            <MessageCircle size={20} />
            功能说明
          </h3>
          
          <div className="space-y-3 text-gray-300">
            <div className="flex items-start gap-3">
              <Heart size={16} className="text-red-500 mt-1 flex-shrink-0" />
              <div>
                <strong className="text-white">点赞功能：</strong>
                登录用户可以对文章进行点赞，支持取消点赞。实时显示点赞数和最近点赞的用户。
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <MessageCircle size={16} className="text-wangfeng-purple mt-1 flex-shrink-0" />
              <div>
                <strong className="text-white">评论功能：</strong>
                登录用户可以发表评论，编辑自己的评论，管理员可以删除任何评论。支持实时刷新。
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <strong className="text-white">权限控制：</strong>
                游客可以查看内容，注册用户可以互动，管理员有额外的管理权限。
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommentDemo;