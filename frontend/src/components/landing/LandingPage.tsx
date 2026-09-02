import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.hash, location.pathname]);

  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/register');
  const handleWorkbenchClick = () => navigate('/api-tester');
  const handleCtaClick = () => isAuthenticated ? navigate('/api-tester') : navigate('/login');

  return (
    <div className="wb-landing-root">
      <LandingHeader
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
        onWorkbenchClick={handleWorkbenchClick}
        onNavigateSection={handleNavigateSection}
        isAuthenticated={isAuthenticated}
      />

      <main className="wb-landing-main">
        <HeroSection
          onGetStartedClick={isAuthenticated ? handleWorkbenchClick : handleLoginClick}
          onViewDocsClick={() => navigate('/docs')}
        />

        <div id="features">
          <MockFeatureSection
            onExploreMockingClick={isAuthenticated ? handleWorkbenchClick : handleLoginClick}
          />
        </div>

        <TestingFeatureSection />

        <PersonalWorkspaceSection />

        <CtaSection
          onCreateAccountClick={handleCtaClick}
        />
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
