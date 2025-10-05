import { useEffect } from 'react';

const StarfieldBackground = () => {
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


    const container = document.getElementById('starfield-container');
    if (container) {
      // 创建150颗星星
      for (let i = 0; i < 150; i++) {
      container.appendChild(createStar());
    }
    
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black to-purple-950/30">
      <div id="starfield-container" className="absolute inset-0 overflow-hidden"></div>
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
