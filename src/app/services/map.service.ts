import { Injectable } from '@angular/core';

/**
 * MapService
 * ---------
 * Lightweight service that lazy-loads the Google Maps JavaScript API.
 * It exposes a Promise-based `load()` method so callers can await the
 * availability of `window.google.maps` before initializing maps.
 *
 * Key features:
 * - Loads the script only once (caches a single Promise)
 * - Handles concurrent callers by returning the same Promise
 * - Attaches to any pre-existing Google Maps <script> tag instead of
 *   inserting a duplicate
 * - Provides a small timeout and error handling
 */

interface LoadOptions {
  apiKey: string;
  libraries?: string[]; // e.g. ['places']
  version?: string;     // e.g. 'weekly' or '3.54'
  timeoutMs?: number;   // how long to wait before rejecting
}

@Injectable({ providedIn: 'root' })
export class MapService {
  // Cached Promise representing the in-progress or completed script load.
  // This prevents multiple script tags and duplicate network requests.
  private loadPromise: Promise<void> | null = null;

  /**
   * Load the Google Maps JavaScript API.
   * @param options LoadOptions containing apiKey and optional params
   * @returns Promise that resolves when `window.google.maps` is available
   */
  load(options: LoadOptions): Promise<void> {
    // Fast-path: if the API is already present, resolve synchronously.
    if ((window as any).google?.maps) {
      return Promise.resolve();
    }

    // If a load is already in progress, return the cached Promise so callers
    // can wait for the same result instead of creating another script tag.
    if (this.loadPromise) {
      return this.loadPromise;
    }

    const { apiKey, libraries = [], version = 'weekly', timeoutMs = 15000 } = options;
    const libs = libraries.length ? `&libraries=${libraries.join(',')}` : '';
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=${encodeURIComponent(version)}${libs}`;

    // Create and cache the Promise that will resolve or reject based on the
    // script element's load/error events and a timeout.
    this.loadPromise = new Promise<void>((resolve, reject) => {
      // If an existing Google Maps script tag is present, reuse it.
      const scriptAlready = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);

      if (scriptAlready) {
        // If the global is already available, resolve immediately.
        if ((window as any).google?.maps) {
          resolve();
          return;
        }
        // Otherwise attach to its load/error events to know when it's ready.
        scriptAlready.addEventListener('load', () => resolve());
        scriptAlready.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
        return;
      }

      // No existing script found: create a new one and append it to the head.
      const s = document.createElement('script');
      s.type = 'text/javascript';
      s.src = src;
      s.async = true;
      s.defer = true;

      // Handlers and cleanup to avoid leaks and handle timeouts.
      const onLoad = () => {
        cleanup();
        // Double-check that the global was created by the script.
        if ((window as any).google?.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps loaded but window.google.maps is not available'));
        }
      };

      const onError = () => {
        cleanup();
        reject(new Error('Failed to load Google Maps script'));
      };

      const cleanup = () => {
        clearTimeout(timer);
        s.removeEventListener('load', onLoad);
        s.removeEventListener('error', onError);
      };

      s.addEventListener('load', onLoad);
      s.addEventListener('error', onError);

      document.head.appendChild(s);

      // Reject after a reasonable timeout to avoid hanging callers forever.
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Timed out loading Google Maps script'));
      }, timeoutMs);
    });

    return this.loadPromise;
  }
}

