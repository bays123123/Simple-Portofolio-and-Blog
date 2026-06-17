import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'bd_visitor_session';

const getSessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
};

const getDevice = (): string => {
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getSource = (): string => {
  const ref = document.referrer;
  if (!ref) return 'Direct';
  try {
    const host = new URL(ref).hostname;
    // Treat same-site navigation as Direct
    if (host === window.location.hostname) return 'Direct';
    return host.replace(/^www\./, '');
  } catch {
    return 'Direct';
  }
};

/**
 * Records a page view on every route change. Admin routes are skipped.
 */
const useVisitorTracking = () => {
  const location = useLocation();
  const lastPath = useRef<string>('');

  useEffect(() => {
    const path = location.pathname;
    if (path === lastPath.current) return;
    if (path.startsWith('/admin') || path.startsWith('/auth')) return;
    lastPath.current = path;

    supabase.functions
      .invoke('track-visit', {
        body: {
          path,
          source: getSource(),
          device: getDevice(),
          sessionId: getSessionId(),
        },
      })
      .catch(() => {
        /* tracking failures must never break the app */
      });
  }, [location.pathname]);
};

export default useVisitorTracking;
