/* Advanced ad handling: detect adblock and show/hide banner.
   - If adblock is ON: show "turn off AdBlock" banner
   - If adblock is OFF: hide banner, normal experience
*/
(function() {
  if (window.__advancedAdsInitialized) return; // prevent double-init
  window.__advancedAdsInitialized = true;

  // Basic config
  const MAX_INLINE_ADS_DENSE = 12; // more ads for AdBlock ON users

  function log() {
    try { console.log.apply(console, ['[ads]'].concat([].slice.call(arguments))); } catch(e) {}
  }

  function createStyleOnce() {
    if (document.getElementById('advanced-ads-styles')) return;
    // House ad styles removed - no longer generating revenue
    const css = `
      /* Minimal styles for banner only */
    `;
    const style = document.createElement('style');
    style.id = 'advanced-ads-styles';
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  function detectAdblock(timeoutMs = 1200) {
    return new Promise((resolve) => {
      let done = false;
      let detectionResults = {
        styleBlocked: false,
        networkBlocked: false,
        scriptBlocked: false,
        elementBlocked: false
      };

      // Method 1: Style-based detection with more aggressive bait
      const baitElements = [];
      const adClasses = [
        'ads', 'ad', 'adsbox', 'sponsor', 'advertisement', 'ad-banner', 
        'advertisement-banner', 'advertisement-block', 'advertisement-container',
        'google-ads', 'google-ad', 'adsense', 'doubleclick', 'advertisement-text',
        'advertisement-content', 'advertisement-wrapper', 'advertisement-header'
      ];

      // Create bait elements with more realistic content (do NOT use visibility:hidden
      // or display:none — we check for those to detect adblock; our own style would cause false positives)
      adClasses.forEach(className => {
        const bait = document.createElement('div');
        bait.className = className;
        bait.style.cssText = 'position:absolute; left:-9999px; top:0; width:1px; height:1px; opacity:0.01; pointer-events:none;';
        bait.innerHTML = 'Advertisement';
        bait.setAttribute('data-ad', 'true');
        document.body.appendChild(bait);
        baitElements.push(bait);
      });

      // Method 2: Network-based detection
      const testUrls = [
        'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
        'https://www.googletagservices.com/tag/js/gpt.js',
        'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
      ];
      
      let networkBlockedCount = 0;
      let networkTests = 0;
      
      // Only treat as network-blocked if most or all ad scripts fail (reduces false positives
      // from firewall, privacy settings, or single script 404)
      const networkBlockedThreshold = Math.ceil(testUrls.length * 0.67);
      testUrls.forEach(url => {
        const script = document.createElement('script');
        script.onload = () => {
          networkTests++;
          if (networkTests === testUrls.length) {
            detectionResults.networkBlocked = networkBlockedCount >= networkBlockedThreshold;
          }
        };
        script.onerror = () => {
          networkBlockedCount++;
          networkTests++;
          if (networkTests === testUrls.length) {
            detectionResults.networkBlocked = networkBlockedCount >= networkBlockedThreshold;
          }
        };
        script.src = url;
        document.head.appendChild(script);
      });

      // Method 3: Element detection (element must stay "visible" in computed style so we only
      // detect when an adblocker hides it, not our own styling)
      const testElement = document.createElement('div');
      testElement.className = 'ads';
      testElement.style.cssText = 'position:absolute; left:-9999px; top:0; width:1px; height:1px; opacity:0.01;';
      testElement.innerHTML = 'Advertisement';
      document.body.appendChild(testElement);

      // Method 4: User-Agent is NOT used for final decision — browser names like Brave, Opera,
      // Vivaldi, DuckDuckGo are not adblock; using them caused false positives for users without adblock
      const userAgent = navigator.userAgent.toLowerCase();
      const hasAdblockIndicator = false;

      // Comprehensive detection
      setTimeout(function() {
        if (done) return;
        done = true;
        
        // Clean up bait elements
        baitElements.forEach(bait => {
          try {
            const style = getComputedStyle(bait);
            const isHidden = style.display === 'none' || 
                           style.visibility === 'hidden' || 
                           bait.offsetParent === null || 
                           bait.offsetHeight === 0 ||
                           bait.offsetWidth === 0;
            if (isHidden) detectionResults.styleBlocked = true;
            document.body.removeChild(bait);
          } catch(e) {
            detectionResults.styleBlocked = true;
          }
        });

        // Check test element
        try {
          const testStyle = getComputedStyle(testElement);
          const isTestHidden = testStyle.display === 'none' || 
                             testStyle.visibility === 'hidden' || 
                             testElement.offsetParent === null || 
                             testElement.offsetHeight === 0 ||
                             testElement.offsetWidth === 0;
          if (isTestHidden) detectionResults.elementBlocked = true;
          document.body.removeChild(testElement);
        } catch(e) {
          detectionResults.elementBlocked = true;
        }

        // Clean up network test scripts
        document.querySelectorAll('script[src*="googlesyndication"], script[src*="googletagservices"], script[src*="doubleclick"]').forEach(script => {
          try { document.head.removeChild(script); } catch(e) {}
        });

        // Final decision: if any method detects adblock, consider it blocked
        const isBlocked = detectionResults.styleBlocked || 
                         detectionResults.networkBlocked || 
                         detectionResults.elementBlocked || 
                         hasAdblockIndicator;

        log('Comprehensive AdBlock detection results:', {
          ...detectionResults,
          hasAdblockIndicator,
          userAgent: userAgent.substring(0, 100),
          finalResult: isBlocked
        });
        
        resolve(isBlocked);
      }, timeoutMs);
    });
  }

  // House ad functions removed - no longer generating revenue

  // House ad insertion functions removed - no longer generating revenue

  function init() {
    // Expose minimal config
    window.adConfig = window.adConfig || {};
    
    // Add test function for debugging
    window.testAdblockDetection = function() {
      log('Testing AdBlock detection...');
      detectAdblock().then(blocked => {
        log('Test result - AdBlock detected:', blocked);
        alert('AdBlock detection test: ' + (blocked ? 'BLOCKED' : 'NOT BLOCKED'));
      });
    };
    
    // Add comprehensive test function
    window.testAdblockComprehensive = function() {
      log('Running comprehensive AdBlock detection test...');
      
      // Test 1: User Agent (browser names like Brave/Opera/Vivaldi not used — they cause false positives)
      const userAgent = navigator.userAgent.toLowerCase();
      const hasAdblockIndicator = false;
      
      // Test 2: Style detection
      const testElement = document.createElement('div');
      testElement.className = 'ads';
      testElement.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px;';
      testElement.innerHTML = 'Advertisement';
      document.body.appendChild(testElement);
      
      setTimeout(() => {
        const style = getComputedStyle(testElement);
        const isHidden = style.display === 'none' || style.visibility === 'hidden' || testElement.offsetParent === null;
        document.body.removeChild(testElement);
        
        // Test 3: Network detection
        const script = document.createElement('script');
        script.onload = () => {
          document.head.removeChild(script);
          const results = {
            userAgent: userAgent.substring(0, 100),
            hasAdblockIndicator,
            styleBlocked: isHidden,
            networkBlocked: false,
            finalResult: hasAdblockIndicator || isHidden
          };
          
          log('Comprehensive test results:', results);
          alert(`AdBlock Test Results:\nUser Agent: ${results.userAgent}\nAdBlock Indicator: ${results.hasAdblockIndicator}\nStyle Blocked: ${results.styleBlocked}\nNetwork Blocked: ${results.networkBlocked}\nFinal Result: ${results.finalResult ? 'BLOCKED' : 'NOT BLOCKED'}`);
        };
        script.onerror = () => {
          document.head.removeChild(script);
          const results = {
            userAgent: userAgent.substring(0, 100),
            hasAdblockIndicator,
            styleBlocked: isHidden,
            networkBlocked: true,
            finalResult: true
          };
          
          log('Comprehensive test results:', results);
          alert(`AdBlock Test Results:\nUser Agent: ${results.userAgent}\nAdBlock Indicator: ${results.hasAdblockIndicator}\nStyle Blocked: ${results.styleBlocked}\nNetwork Blocked: ${results.networkBlocked}\nFinal Result: ${results.finalResult ? 'BLOCKED' : 'NOT BLOCKED'}`);
        };
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        document.head.appendChild(script);
      }, 100);
    };
    
    // Add simple detection test
    window.testSimpleDetection = function() {
      log('Running simple AdBlock detection test...');
      
      // Create a simple test element
      const testElement = document.createElement('div');
      testElement.className = 'ads';
      testElement.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px;';
      testElement.innerHTML = 'Advertisement';
      document.body.appendChild(testElement);
      
      setTimeout(() => {
        const style = getComputedStyle(testElement);
        const isHidden = style.display === 'none' || style.visibility === 'hidden' || testElement.offsetParent === null;
        document.body.removeChild(testElement);
        
        const userAgent = navigator.userAgent.toLowerCase();
        const hasAdblockIndicator = false; // browser names no longer used to avoid false positives
        
        const result = hasAdblockIndicator || isHidden;
        
        log('Simple test results:', { isHidden, hasAdblockIndicator, result });
        alert(`Simple AdBlock Test:\nElement Hidden: ${isHidden}\nBrowser Indicator: ${hasAdblockIndicator}\nFinal Result: ${result ? 'BLOCKED' : 'NOT BLOCKED'}`);
      }, 100);
    };
    
    log('Starting AdBlock detection...');
    detectAdblock().then(blocked => {
      window.adConfig.adBlockDetected = !!blocked;
      log('AdBlock detection completed. Result:', blocked);
      log('Setting body class to:', blocked ? 'adblock-on' : 'adblock-off');
      
      // Track AdBlock status on server
      try {
        fetch('/api/track-adblock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adblock: blocked,
            page: window.location.pathname,
            timestamp: new Date().toISOString()
          })
        }).then(response => {
          if (response.ok) {
            log('AdBlock status tracked on server');
          } else {
            log('Failed to track AdBlock status');
          }
        }).catch(error => {
          log('Error tracking AdBlock status:', error);
        });
      } catch (e) {
        log('Error sending AdBlock tracking request:', e);
      }
      
      try {
        document.body.classList.remove('adblock-on', 'adblock-off');
        document.body.classList.add(blocked ? 'adblock-on' : 'adblock-off');
        // Force banner visibility update
        const banner = document.getElementById('adblock-banner');
        if (banner) {
          banner.style.display = blocked ? 'block' : 'none';
          log('Banner visibility set to:', blocked ? 'block' : 'none');
        }
      } catch(e) {
        log('Error setting body class:', e);
      }
      if (blocked) {
        log('AdBlock detected - showing banner (no redirect)');
      } else {
        // Only hide ads on non-match pages, never on match pages
        const isMatchPage = /^\/match\//.test(location.pathname);
        if (!isMatchPage) {
          try {
            // Hide common ad iframes by known providers ONLY on non-match pages
            const adIframeSelectors = [
              'iframe[src*="otieu.com"]',
              'iframe[src*="madurird.com"]',
              'iframe[src*="al5sm.com"]',
              'iframe[src*="kt.restowelected.com"]',
              'iframe[src*="np.mournersamoa.com"]',
              'iframe[src*="shoukigaigoors.net"]',
              'iframe[src*="tzegilo.com"]'
            ];
            document.querySelectorAll(adIframeSelectors.join(',')).forEach(el => {
              const container = el.closest('section, .bg-gray-800, .ad, .ad-slot, .ad-inline, .container, div');
              (container || el).style.display = 'none';
            });
            // Hide generic blocks labeled "Advertisement" ONLY on non-match pages
            document.querySelectorAll('p, span, div').forEach(el => {
              try {
                const txt = (el.textContent || '').trim().toLowerCase();
                if (txt === 'advertisement' || txt === 'advertisements') {
                  const container = el.closest('section, .bg-gray-800, .ad, .ad-slot, .ad-inline, .container, div');
                  (container || el).style.display = 'none';
                }
              } catch(e) {}
            });
          } catch (e) {}
        } else {
          // On match pages, ensure ads are visible and not blocked
          log('Match page detected - ensuring ads are visible');
        }
        
        // Remove provider script for AdBlock OFF users
        try {
          const providerScript = document.getElementById('adblock-provider-script');
          if (providerScript) {
            providerScript.remove();
            log('Removed provider script for AdBlock OFF users');
          }
        } catch (e) {
          log('Error removing provider script:', e);
        }
      }

      // Wire up whitelist modal and actions (homepage banner)
      try {
        const openBtn = document.getElementById('whitelist-btn');
        const modal = document.getElementById('whitelist-modal');
        const closeBtn = document.getElementById('whitelist-close');
        const copyBtn = document.getElementById('whitelist-copy');
        const recheckBtn = document.getElementById('whitelist-recheck');
        const feedback = document.getElementById('whitelist-feedback');
        const domain = location.hostname.replace(/^www\./, '');

        // Debug: Add manual test button (remove in production)
        if (location.hostname === 'localhost' || location.hostname.includes('127.0.0.1')) {
          const testBtn = document.createElement('button');
          testBtn.textContent = 'TEST: Force AdBlock ON';
          testBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:red;color:white;padding:5px;border:none;cursor:pointer;';
          testBtn.onclick = () => {
            document.body.classList.remove('adblock-off');
            document.body.classList.add('adblock-on');
            const banner = document.getElementById('adblock-banner');
            if (banner) banner.style.display = 'block';
            // House ads removed - only activate provider script
            const providerScript = document.getElementById('adblock-provider-script');
            if (providerScript && !window.__adblockProviderLoaded) {
              providerScript.src = providerScript.dataset.src;
              providerScript.async = true;
              providerScript.setAttribute('data-cfasync', providerScript.dataset.cfasync);
              providerScript.dataset.zone = providerScript.dataset.zone;
              window.__adblockProviderLoaded = true;
              log('Manual test: Activated provider script');
            }
            log('Manual AdBlock ON test activated (house ads removed)');
          };
          document.body.appendChild(testBtn);
          
          // Also add a button to check detection status
          const statusBtn = document.createElement('button');
          statusBtn.textContent = 'CHECK STATUS';
          statusBtn.style.cssText = 'position:fixed;top:50px;right:10px;z-index:99999;background:blue;color:white;padding:5px;border:none;cursor:pointer;';
          statusBtn.onclick = () => {
            log('Current status:', {
              adBlockDetected: window.adConfig?.adBlockDetected,
              bodyClass: document.body.className,
              providerLoaded: window.__adblockProviderLoaded,
              bannerVisible: document.getElementById('adblock-banner')?.style.display
            });
          };
          document.body.appendChild(statusBtn);
          
          // Add a button to simulate AdBlock OFF (for testing redirect back)
          const offBtn = document.createElement('button');
          offBtn.textContent = 'TEST: Force AdBlock OFF';
          offBtn.style.cssText = 'position:fixed;top:90px;right:10px;z-index:99999;background:green;color:white;padding:5px;border:none;cursor:pointer;';
          offBtn.onclick = () => {
            document.body.classList.remove('adblock-on');
            document.body.classList.add('adblock-off');
            const banner = document.getElementById('adblock-banner');
            if (banner) banner.style.display = 'none';
            log('Manual AdBlock OFF test activated');
          };
          document.body.appendChild(offBtn);
        }

        if (openBtn && modal) {
          openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
          });
        }
        if (closeBtn && modal) {
          closeBtn.addEventListener('click', function() {
            modal.classList.add('hidden');
          });
          modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.classList.add('hidden');
          });
        }
        if (copyBtn) {
          copyBtn.addEventListener('click', async function() {
            try {
              await navigator.clipboard.writeText(domain);
              if (feedback) {
                feedback.textContent = 'Copied!';
                feedback.classList.remove('hidden');
                setTimeout(()=>feedback.classList.add('hidden'), 1500);
              }
            } catch (e) {}
          });
        }
        if (recheckBtn) {
          recheckBtn.addEventListener('click', function() {
            detectAdblock(800).then(isBlocked => {
              if (!isBlocked) {
                document.body.classList.remove('adblock-on');
                document.body.classList.add('adblock-off');
                if (modal) modal.classList.add('hidden');
                const banner = document.getElementById('adblock-banner');
                if (banner) banner.style.display = 'none';
                if (feedback) {
                  feedback.textContent = 'AdBlock is off. You\'re good!';
                  feedback.classList.remove('hidden');
                  setTimeout(() => feedback.classList.add('hidden'), 2000);
                }
              } else {
                if (feedback) {
                  feedback.textContent = 'Still blocked. Please whitelist and try again.';
                  feedback.classList.remove('hidden');
                }
              }
            });
          });
        }
      } catch (e) {}
    }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


