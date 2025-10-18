import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';

interface PlaceholderAdminProps {
  title: string;
  description?: string;
}

const PlaceholderAdmin: React.FC<PlaceholderAdminProps> = ({ title, description }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="mx-auto w-20 h-20 rounded-full bg-wangfeng-purple/20 flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-wangfeng-purple" />
        </div>
        <h2 className="text-2xl font-bebas tracking-wider text-white mb-2">{title}</h2>
        <p className="text-gray-400">{description || '该功能正在开发中，敬请期待'}</p>
      </motion.div>
    </div>
  );
};

export default PlaceholderAdmin;
