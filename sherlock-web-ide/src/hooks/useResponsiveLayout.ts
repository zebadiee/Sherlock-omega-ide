/**
 * Responsive Layout Hook
 * Manages responsive behavior and layout adaptations
 */

import { useState, useEffect } from 'react';

export interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

export interface ResponsiveState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  wide: 1920
};

export const useResponsiveLayout = (breakpoints: BreakpointConfig = defaultBreakpoints): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        orientation: 'landscape',
        devicePixelRatio: 1
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
      isWide: width >= breakpoints.desktop,
      orientation: width > height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        width,
        height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
        isWide: width >= breakpoints.desktop,
        orientation: width > height ? 'landscape' : 'portrait',
        devicePixelRatio: window.devicePixelRatio || 1
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [breakpoints]);

  return state;
};

// Layout configuration based on screen size
export const getResponsiveLayoutConfig = (responsive: ResponsiveState) => {
  if (responsive.isMobile) {
    return {
      sidebarWidth: Math.min(280, responsive.width * 0.8),
      sidebarCollapsed: true,
      bottomPanelHeight: Math.min(200, responsive.height * 0.4),
      bottomPanelCollapsed: false,
      showActivityBar: true,
      activityBarWidth: 48,
      tabSize: 'small',
      fontSize: 13,
      lineHeight: 1.4,
      showMinimap: false,
      showLineNumbers: true,
      wordWrap: true
    };
  }

  if (responsive.isTablet) {
    return {
      sidebarWidth: 300,
      sidebarCollapsed: false,
      bottomPanelHeight: 250,
      bottomPanelCollapsed: false,
      showActivityBar: true,
      activityBarWidth: 48,
      tabSize: 'medium',
      fontSize: 14,
      lineHeight: 1.5,
      showMinimap: false,
      showLineNumbers: true,
      wordWrap: false
    };
  }

  if (responsive.isDesktop) {
    return {
      sidebarWidth: 320,
      sidebarCollapsed: false,
      bottomPanelHeight: 300,
      bottomPanelCollapsed: false,
      showActivityBar: true,
      activityBarWidth: 48,
      tabSize: 'large',
      fontSize: 14,
      lineHeight: 1.6,
      showMinimap: true,
      showLineNumbers: true,
      wordWrap: false
    };
  }

  // Wide screen
  return {
    sidebarWidth: 350,
    sidebarCollapsed: false,
    bottomPanelHeight: 350,
    bottomPanelCollapsed: false,
    showActivityBar: true,
    activityBarWidth: 48,
    tabSize: 'large',
    fontSize: 15,
    lineHeight: 1.6,
    showMinimap: true,
    showLineNumbers: true,
    wordWrap: false
  };
};

export default useResponsiveLayout;