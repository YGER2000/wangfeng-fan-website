import { useEffect } from 'react';
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
import ScheduleDetail from './components/pages/ScheduleDetail';
import Gallery from './components/pages/Gallery';
import FengYanFengYu from './components/pages/FengYanFengYuNew';
import FengMiLiaoFeng from './components/pages/FengMiLiaoFengNew';
import ShuJuKePu from './components/pages/ShuJuKePuNew';
import VideoArchive from './components/pages/VideoArchive';
import VideoDetail from './components/pages/VideoDetail';
import AboutSite from './components/pages/AboutSite';
import ArticleDetailPage from './components/pages/ArticleDetailPage';
import Profile from './components/pages/Profile';
import GameActivity from './components/pages/GameActivity';

// Admin area
import ProtectedRoute from './components/admin/ProtectedRoute';
import NewAdminLayout from './components/admin/NewAdminLayout';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/admin/pages/Dashboard';
import SimpleDashboard from './components/admin/pages/SimpleDashboard';
import ProfileAdmin from './components/admin/pages/ProfileAdmin';

// 普通用户页面 - 卡片式
import MyArticleList from './components/admin/pages/MyArticleList';
import MyVideoList from './components/admin/pages/MyVideoList';
import MyGalleryList from './components/admin/pages/MyGalleryList';

// Note: AllArticleList, AllVideoList, AllGalleryList are deprecated
// They have been replaced by unified management interfaces:
// - ManageArticleList for articles
// - ReviewVideoList for video reviews
// - ReviewGalleryList for gallery reviews

// 编辑器和创建页面
import ArticleCreate from './components/admin/pages/ArticleCreate';
import ArticleEdit from './components/admin/pages/ArticleEdit';
import ScheduleCreate from './components/admin/pages/ScheduleCreate';
import ScheduleEdit from './components/admin/pages/ScheduleEdit';
import ScheduleList from './components/admin/pages/ScheduleList';
import VideoCreate from './components/admin/pages/VideoCreate';
import VideoEdit from './components/admin/pages/VideoEdit';
import GalleryUpload from './components/admin/pages/GalleryUpload';
import GalleryEdit from './components/admin/pages/GalleryEdit';
import TagManager from './components/admin/pages/TagManager';
import PlaceholderPage from './components/admin/pages/PlaceholderPage';
import ReviewPanel from './components/admin/pages/ReviewPanel';
import ArticleReview from './components/admin/pages/ArticleReview';
import ArticleEditPublish from './components/admin/pages/ArticleEditPublish';
import ReviewVideoList from './components/admin/pages/ReviewVideoList';
import VideoReview from './components/admin/pages/VideoReview';
import ReviewGalleryList from './components/admin/pages/ReviewGalleryList';
import GalleryReview from './components/admin/pages/GalleryReview';
import ManageArticleList from './components/admin/pages/ManageArticleList';

const AppContent = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const location = useLocation();
  
  // 路由切换后自动滚动到页面顶部，避免残留的滚动位置影响体验
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search]);
  
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
      <BackgroundManager key={theme} mode={isLight ? 'light' : 'dark'} />

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
          <Route path="/schedule/:id" element={<ScheduleDetail />} />
          <Route path="/discography" element={<Discography />} />
          <Route path="/video-archive" element={<VideoArchive />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/shu-ju-ke-pu" element={<ShuJuKePu />} />
          <Route path="/feng-yan-feng-yu" element={<FengYanFengYu />} />
          <Route path="/feng-mi-liao-feng" element={<FengMiLiaoFeng />} />
          <Route path="/game-activity" element={<GameActivity />} />
          <Route path="/about-site" element={<AboutSite />} />
          <Route path="/video/:id" element={<VideoDetail />} />
          <Route path="/article/:slug" element={<ArticleDetailPage />} />

          {/* New Admin Login - No Auth Required */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* New Admin Routes - With Auth */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin', 'user']}>
                <NewAdminLayout />
              </ProtectedRoute>
            }
          >
            {/* 通用页面 */}
            <Route path="dashboard" element={<SimpleDashboard />} />
            <Route path="profile" element={<ProfileAdmin />} />

            {/* 普通用户 - 我的内容(卡片式) */}
            <Route path="my-articles" element={<MyArticleList />} />
            <Route path="my-videos" element={<MyVideoList />} />
            <Route path="my-gallery" element={<MyGalleryList />} />

            {/* 编辑和创建页面 */}
            <Route
              path="articles/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ArticleCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="articles/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ArticleEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="articles/review/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ArticleReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="videos/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <VideoCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="videos/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <VideoEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="videos/edit-publish/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <VideoEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="gallery/upload"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <GalleryUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="gallery/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <GalleryEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="gallery/edit-publish/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <GalleryEdit />
                </ProtectedRoute>
              }
            />


            {/* 管理中心 - 行程和标签管理 */}
            <Route path="manage/schedules" element={<Navigate to="/admin/manage/schedules/list" replace />} />
            <Route
              path="manage/schedules/create"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ScheduleCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/schedules/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ScheduleEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/schedules/list"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ScheduleList />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/tags"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <TagManager />
                </ProtectedRoute>
              }
            />

            {/* 管理中心 - 文章管理 */}
            <Route
              path="manage/articles"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ManageArticleList />
                </ProtectedRoute>
              }
            />
            <Route
              path="articles/edit-publish/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ArticleEditPublish />
                </ProtectedRoute>
              }
            />
            <Route
              path="manage/videos"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ReviewVideoList />
                </ProtectedRoute>
              }
            />
            <Route
              path="videos/review/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <VideoReview />
                </ProtectedRoute>
              }
            />

            {/* 管理中心 - 图片审核列表 */}
            <Route
              path="manage/gallery"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ReviewGalleryList />
                </ProtectedRoute>
              }
            />
            <Route
              path="gallery/review/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <GalleryReview />
                </ProtectedRoute>
              }
            />

            {/* 审核面板 (保留兼容性) */}
            <Route
              path="review-panel"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <ReviewPanel />
                </ProtectedRoute>
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
