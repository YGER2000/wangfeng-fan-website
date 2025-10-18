import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import FengYanFengYu from './components/pages/FengYanFengYuNew';
import FengMiLiaoFeng from './components/pages/FengMiLiaoFengNew';
import ShuJuKePu from './components/pages/ShuJuKePuNew';
import VideoArchive from './components/pages/VideoArchive';
import VideoDetail from './components/pages/VideoDetail';
import AboutSite from './components/pages/AboutSite';
import ArticleDetailPage from './components/pages/ArticleDetailPage';
import Profile from './components/pages/Profile';

// Admin area
import ProtectedRoute from './components/admin/ProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import NewAdminLayout from './components/admin/NewAdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/pages/Dashboard';
import SimpleDashboard from './components/admin/pages/SimpleDashboard';
import ProfileAdmin from './components/admin/pages/ProfileAdmin';
import ArticleCreate from './components/admin/pages/ArticleCreate';
import ArticleEdit from './components/admin/pages/ArticleEdit';
import ArticleList from './components/admin/pages/ArticleList';
import ScheduleCreate from './components/admin/pages/ScheduleCreate';
import ScheduleEdit from './components/admin/pages/ScheduleEdit';
import ScheduleList from './components/admin/pages/ScheduleList';
import PlaceholderAdmin from './components/admin/pages/PlaceholderAdmin';
import VideoCreate from './components/admin/pages/VideoCreate';
import VideoEdit from './components/admin/pages/VideoEdit';
import VideoList from './components/admin/pages/VideoList';
import GalleryUpload from './components/admin/pages/GalleryUpload';
import TagManager from './components/admin/pages/TagManager';
import GalleryList from './components/admin/pages/GalleryList';
import GalleryEdit from './components/admin/pages/GalleryEdit';
import DashboardOverview from './components/admin/pages/DashboardOverview';
import ReviewCenter from './components/admin/pages/ReviewCenter';
import ScheduleManager from './components/admin/pages/ScheduleManager';
import UserManagement from './components/admin/pages/UserManagement';
import SystemLogs from './components/admin/pages/SystemLogs';
import VideoManagement from './components/admin/pages/VideoManagement';
import PlaceholderPage from './components/admin/pages/PlaceholderPage';

const AppContent = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const location = useLocation();
  
  // 判断当前是否在管理界面
  const isAdminRoute = location.pathname.startsWith('/admin');

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
          <Route path="/tour-dates" element={<TourDates />} />
          <Route path="/discography" element={<Discography />} />
          <Route path="/video-archive" element={<VideoArchive />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/shu-ju-ke-pu" element={<ShuJuKePu />} />
          <Route path="/feng-yan-feng-yu" element={<FengYanFengYu />} />
          <Route path="/feng-mi-liao-feng" element={<FengMiLiaoFeng />} />
          <Route path="/about-site" element={<AboutSite />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/article/:slug" element={<ArticleDetailPage />} />

          {/* New Admin Login - No Auth Required */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* New Admin Routes - With Auth */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <NewAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<SimpleDashboard />} />
            <Route path="dashboard-full" element={<Dashboard />} />
            <Route path="articles/create" element={<ArticleCreate />} />
            <Route path="articles/edit/:id" element={<ArticleEdit />} />
            <Route path="articles/list" element={<ArticleList />} />
            <Route path="schedules/create" element={<ScheduleCreate />} />
            <Route path="schedules/edit/:id" element={<ScheduleEdit />} />
            <Route path="schedules/list" element={<ScheduleList />} />
            <Route path="videos/create" element={<VideoCreate />} />
            <Route path="videos/list" element={<VideoList />} />
            <Route path="videos/edit/:id" element={<VideoEdit />} />
            <Route path="gallery/upload" element={<GalleryUpload />} />
            <Route path="tags" element={<TagManager />} />
            <Route path="gallery/list" element={<GalleryList />} />
            <Route path="gallery/edit/:id" element={<GalleryEdit />} />
            <Route path="profile" element={<ProfileAdmin />} />
          </Route>

          {/* Old Admin Routes (Keep for compatibility) */}
          <Route
            path="/admin-old"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="review" element={<ReviewCenter />} />
            <Route path="schedules" element={<ScheduleManager />} />
            <Route path="videos" element={<VideoManagement />} />
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
      {/* 只在非管理界面显示Footer */}
      {!isAdminRoute && <Footer />}

      {/* Global Music Player */}
      <MusicPlayer />

      {/* Floating fan comments - Wang Feng themed (隐藏于后台) */}
      {!isAdminRoute && (
        <div className="fixed bottom-12 right-6 z-40 hidden md:block">
          <div
            className={cn(
              'border-2 border-wangfeng-purple text-wangfeng-purple text-sm py-2 px-4 rounded-xl font-bold animate-float shadow-glow transition-colors duration-300',
              isLight ? 'bg-white/80 backdrop-blur-md' : 'bg-black/70'
            )}
          >
            感受峰 感受存在! 🎸💜
          </div>
        </div>
      )}
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