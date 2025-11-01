import { useEffect, useRef } from 'react';

const StarfieldBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const starsCreatedRef = useRef(false);

  useEffect(() => {
    const createStar = () => {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full bg-white opacity-70 animate-twinkle';
      star.style.width = Math.random() * 2 + 1 + 'px';
      star.style.height = star.style.width;
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.animationDuration = Math.random() * 3 + 2 + 's';

      return star;
    };

    const container = containerRef.current;

    // 确保容器存在且星星尚未创建
    if (container && !starsCreatedRef.current) {
      // 清空容器（以防万一）
      container.innerHTML = '';

      // 创建150颗星星
      for (let i = 0; i < 150; i++) {
        container.appendChild(createStar());
      }

      starsCreatedRef.current = true;
    }

    return () => {
      // 清理时重置标记
      if (container) {
        container.innerHTML = '';
        starsCreatedRef.current = false;
      }
    };
  }, []); // 仅在组件挂载时运行

  return (
    <div className="fixed inset-0 -z-10 bg-[#070112]">
      <div ref={containerRef} className="absolute inset-0 overflow-hidden"></div>
    </div>
  );
};

const LightBackground = () => (
  <div className="fixed inset-0 -z-10 bg-gradient-to-b from-white via-white to-gray-100" />
);

interface BackgroundManagerProps {
  mode?: 'dark' | 'light';
}

const BackgroundManager = ({ mode = 'dark' }: BackgroundManagerProps) => {
  if (mode === 'light') {
    return <LightBackground />;
  }

  return <StarfieldBackground />;
};

export default BackgroundManager;
