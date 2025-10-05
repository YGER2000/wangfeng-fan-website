import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import context providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { cn } from '@/lib/utils';

// Import layout components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import MusicPlayer from './components/ui/MusicPlayer';
import BackgroundManager from './components/ui/backgrounds/BackgroundManager';

// Import page components
import Home from './components/pages/Home';
import About from './components/pages/About';
import Discography from './components/pages/Discography';
import TourDates from './components/pages/TourDates';
import Gallery from './components/pages/Gallery';
import Awards from './components/pages/Awards';
import News from './components/pages/News';
import ActingCareer from './components/pages/ActingCareer';
import Contact from './components/pages/Contact';
import Quotes from './components/pages/Quotes';
import FengYanFengYu from './components/pages/FengYanFengYuNew';
import FengMiLiaoFeng from './components/pages/FengMiLiaoFengNew';
import ShuJuKePu from './components/pages/ShuJuKePuNew';
import ArticleDetail from './components/pages/ArticleDetail';
import ArticleDetailPage from './components/pages/ArticleDetailPage';
import CommentDemo from './components/pages/CommentDemo';
import WriteArticle from './components/pages/WriteArticle';
import PublishSchedule from './components/pages/PublishSchedule';

const AppContent = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  return (
    <div
      className={cn(
        'app-shell flex flex-col min-h-screen relative overflow-hidden transition-colors duration-300',
        isLight ? 'bg-white text-gray-900' : 'text-white'
      )}
    >
      {/* 动态背景系统 */}
      <BackgroundManager mode={isLight ? 'light' : 'dark'} />

      <Header />
      <main
        className={cn(
          'flex-1 z-10 relative transition-colors duration-300',
          isLight ? 'bg-white' : 'bg-transparent'
        )}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/discography" element={<Discography />} />
          <Route path="/tour-dates" element={<TourDates />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/news" element={<News />} />
          <Route path="/acting-career" element={<ActingCareer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/feng-yan-feng-yu" element={<FengYanFengYu />} />
          <Route path="/feng-mi-liao-feng" element={<FengMiLiaoFeng />} />
          <Route path="/shu-ju-ke-pu" element={<ShuJuKePu />} />
          <Route path="/article/:slug" element={<ArticleDetailPage />} />
          <Route path="/article-old/:slug" element={<ArticleDetail />} />
          <Route path="/comment-demo" element={<CommentDemo />} />
          <Route path="/write-article" element={<WriteArticle />} />
          <Route path="/publish-schedule" element={<PublishSchedule />} />
        </Routes>
      </main>
      <Footer />

      {/* Global Music Player */}
      <MusicPlayer />

      {/* Floating fan comments - Wang Feng themed */}
      <div className="fixed bottom-12 right-6 z-40 hidden md:block">
        <div
          className={cn(
            'border-2 border-wangfeng-purple text-wangfeng-purple text-sm py-2 px-4 rounded-xl font-bold animate-float shadow-glow transition-colors duration-300',
            isLight ? 'bg-white/80 backdrop-blur-md' : 'bg-black/70'
          )}
        >
          摇滚精神永不灭! 🎸💜
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
