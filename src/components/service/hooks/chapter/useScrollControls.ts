import { useState, useEffect, useRef } from 'react';

export function useScrollControls(initialVisible: boolean = true, idleDelay: number = 2000) {
  const [controlsVisible, setControlsVisible] = useState(initialVisible);
  const [isHovering, setIsHovering] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (isHovering) {
        setControlsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);
      
      if (scrollDelta > 10) {
        setControlsVisible(false);
      }
      
      lastScrollY = currentScrollY;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = window.setTimeout(() => {
        if (!isHovering) {
          setControlsVisible(true);
        }
      }, idleDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [idleDelay, isHovering]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setControlsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      setControlsVisible(true);
    }, idleDelay);
  };

  return { controlsVisible, handleMouseEnter, handleMouseLeave };
}