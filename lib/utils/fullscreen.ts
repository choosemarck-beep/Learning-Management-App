/**
 * Fullscreen utility functions
 * Handles cross-browser fullscreen API with fallbacks
 */

/**
 * Request fullscreen for an element
 * Tries video element first, then container, with browser-specific fallbacks
 */
export async function requestFullscreen(
  element: HTMLElement | HTMLVideoElement | null
): Promise<void> {
  if (!element) {
    throw new Error("Element not found");
  }

  try {
    // Try standard API first
    if (element.requestFullscreen) {
      await element.requestFullscreen();
      return;
    }

    // WebKit (Safari, Chrome < 15)
    if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
      return;
    }

    // WebKit (Safari mobile)
    if ((element as any).webkitEnterFullscreen) {
      (element as any).webkitEnterFullscreen();
      return;
    }

    // Mozilla (Firefox)
    if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
      return;
    }

    // Microsoft (IE/Edge)
    if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
      return;
    }

    throw new Error("Fullscreen API not supported");
  } catch (error) {
    console.error("[Fullscreen] Error entering fullscreen:", error);
    throw error;
  }
}

/**
 * Exit fullscreen
 */
export async function exitFullscreen(): Promise<void> {
  try {
    // Try standard API first
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }

    // WebKit (Safari, Chrome < 15)
    if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
      return;
    }

    // WebKit (Safari mobile)
    if ((document as any).webkitCancelFullScreen) {
      await (document as any).webkitCancelFullScreen();
      return;
    }

    // Mozilla (Firefox)
    if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
      return;
    }

    // Microsoft (IE/Edge)
    if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
      return;
    }

    throw new Error("Exit fullscreen API not supported");
  } catch (error) {
    console.error("[Fullscreen] Error exiting fullscreen:", error);
    throw error;
  }
}

/**
 * Check if element is currently in fullscreen
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Get the element currently in fullscreen
 */
export function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  );
}

/**
 * Toggle fullscreen for an element
 * Tries video element first (for better mobile support), then container
 */
export async function toggleFullscreen(
  videoElement: HTMLVideoElement | null,
  containerElement: HTMLElement | null
): Promise<void> {
  const isCurrentlyFullscreen = isFullscreen();

  if (isCurrentlyFullscreen) {
    // Exit fullscreen
    await exitFullscreen();
  } else {
    // Enter fullscreen - try video element first (better for mobile), then container
    if (videoElement) {
      try {
        await requestFullscreen(videoElement);
        return;
      } catch (error) {
        console.warn("[Fullscreen] Video element fullscreen failed, trying container:", error);
      }
    }

    // Fallback to container (or use container if no video element)
    if (containerElement) {
      try {
        await requestFullscreen(containerElement);
      } catch (error) {
        console.error("[Fullscreen] Container fullscreen failed:", error);
        throw error;
      }
    } else if (!videoElement) {
      throw new Error("No element available for fullscreen");
    }
  }
}

/**
 * Setup fullscreen change listeners
 * Returns cleanup function
 */
export function setupFullscreenListeners(
  callback: (isFullscreen: boolean) => void
): () => void {
  const handleFullscreenChange = () => {
    callback(isFullscreen());
  };

  // Add all browser-specific event listeners
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
  document.addEventListener("mozfullscreenchange", handleFullscreenChange);
  document.addEventListener("MSFullscreenChange", handleFullscreenChange);

  // Return cleanup function
  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
    document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
  };
}

