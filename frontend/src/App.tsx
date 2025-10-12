import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import WriteArticle from './components/pages/WriteArticle';
import PublishSchedule from './components/pages/PublishSchedule';
import Profile from './components/pages/Profile';

// Admin area
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import DashboardOverview from './components/admin/pages/DashboardOverview';
import ReviewCenter from './components/admin/pages/ReviewCenter';
import ScheduleManager from './components/admin/pages/ScheduleManager';
import UserManagement from './components/admin/pages/UserManagement';
import SystemLogs from './components/admin/pages/SystemLogs';
import PlaceholderPage from './components/admin/pages/PlaceholderPage';

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
          <Route path="/峰言峰语" element={<FengYanFengYu />} />
          <Route path="/峰迷荟萃" element={<FengMiLiaoFeng />} />
          <Route path="/资料科普" element={<ShuJuKePu />} />
          <Route path="/feng-yan-feng-yu" element={<Navigate to="/峰言峰语" replace />} />
          <Route path="/feng-mi-liao-feng" element={<Navigate to="/峰迷荟萃" replace />} />
          <Route path="/shu-ju-ke-pu" element={<Navigate to="/资料科普" replace />} />
          <Route path="/article/:slug" element={<ArticleDetailPage />} />
          <Route path="/article-old/:slug" element={<ArticleDetail />} />
          <Route path="/write-article" element={<WriteArticle />} />
          <Route path="/publish-schedule" element={<PublishSchedule />} />
          <Route path="/profile" element={<Profile />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="review" element={<ReviewCenter />} />
            <Route path="schedules" element={<ScheduleManager />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="audit" element={<SystemLogs />} />
            <Route
              path="*"
              element={
                <PlaceholderPage
                  title="模块开发中"
                  description="该后台模块正在完善，将很快与大家见面。"
                />
              }
            />
          </Route>
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
