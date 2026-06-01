
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import FeedbackButton from './components/feedback/FeedbackButton';
import Footer from './components/layout/Footer';
import Navbar from './components/layout/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { ProblemProvider } from './contexts/ProblemContext';
import AboutUsPage from './pages/AboutUsPage';
import CompletedProblemsPage from './pages/CompletedProblemsPage';
import ContactPage from './pages/ContactPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';
import SheetPage from './pages/SheetPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProblemProvider>
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/sheet/:sheetId" element={<SheetPage />} />
                <Route path="/about" element={<AboutUsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/completed-problems" element={<CompletedProblemsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
            <FeedbackButton />
          </div>
        </ProblemProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
