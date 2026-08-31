import React, { useEffect } from 'react';
import './landing.css';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { MockFeatureSection } from './MockFeatureSection';
import { TestingFeatureSection } from './TestingFeatureSection';
import { PersonalWorkspaceSection } from './PersonalWorkspaceSection';
import { CtaSection } from './CtaSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
  onWorkbenchClick: () => void;
  isAuthenticated: boolean;
  userName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onSignUpClick,
  onWorkbenchClick,
  isAuthenticated,
  userName,
}) => {
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

  return (
    <div className="wb-landing-root">
      {/* 1. Header Navigation: Login and Sign Up work as they are */}
      <LandingHeader
        onLoginClick={onLoginClick}
        onSignUpClick={onSignUpClick}
        onWorkbenchClick={onWorkbenchClick}
        onNavigateSection={handleNavigateSection}
        isAuthenticated={isAuthenticated}
        userName={userName}
      />

      {/* Main Content Flow */}
      <main className="wb-landing-main">
        {/* 2. Hero Section: "Start Working For Free" takes user to login page */}
        <HeroSection
          onGetStartedClick={isAuthenticated ? onWorkbenchClick : onLoginClick}
          onViewDocsClick={() => {}}
        />

        {/* 3. Instant Simulated Endpoints: "Explore Mocking" takes user to login page */}
        <div id="features">
          <MockFeatureSection
            onExploreMockingClick={isAuthenticated ? onWorkbenchClick : onLoginClick}
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
          onCreateAccountClick={isAuthenticated ? onWorkbenchClick : onLoginClick}
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
