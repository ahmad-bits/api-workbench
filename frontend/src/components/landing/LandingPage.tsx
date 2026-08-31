import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './landing.css';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { MockFeatureSection } from './MockFeatureSection';
import { TestingFeatureSection } from './TestingFeatureSection';
import { PersonalWorkspaceSection } from './PersonalWorkspaceSection';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Smooth scroll handler for anchor links
  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    // Scroll to top upon mounting
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/register');
  const handleWorkbenchClick = () => navigate('/tester');
  const handleCtaClick = () => isAuthenticated ? navigate('/tester') : navigate('/login');

  return (
    <div className="wb-landing-root">
      {/* 1. Header Navigation */}
      <LandingHeader
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
        onWorkbenchClick={handleWorkbenchClick}
        onNavigateSection={handleNavigateSection}
        isAuthenticated={isAuthenticated}
        userName={user?.name || user?.username}
      />

      {/* Main Content Flow */}
      <main className="wb-landing-main">
        {/* 2. Hero Section */}
        <HeroSection
          onGetStartedClick={isAuthenticated ? handleWorkbenchClick : handleLoginClick}
          onViewDocsClick={() => {}}
        />

        {/* 3. Instant Simulated Endpoints */}
        <div id="features">
          <MockFeatureSection
            onExploreMockingClick={isAuthenticated ? handleWorkbenchClick : handleLoginClick}
          />
        </div>

        {/* 4. Comprehensive Testing Workspace */}
        <div id="how-it-works">
          <TestingFeatureSection />
        </div>

        {/* 5. Your Personal Workspace */}
        <PersonalWorkspaceSection />

        {/* 6. Call To Action Blue Banner */}
        <CtaSection
          onCreateAccountClick={handleCtaClick}
        />
      </main>

      {/* 7. Footer */}
      <LandingFooter
        onNavigateSection={handleNavigateSection}
      />
    </div>
  );
};

export default LandingPage;
