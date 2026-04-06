// src/utils/antiBot.js

let loginStartTime = null;
let firstKeyPressTime = null;
let keyPressCount = 0;
let mouseMovements = 0;
let _interactionCount = 0;  // Renamed with underscore
let suspiciousPatterns = 0;
let _visibilityChanges = 0;  // Renamed with underscore

// Start timer when page loads
const startTimer = () => {
  loginStartTime = Date.now();
  firstKeyPressTime = null;
  keyPressCount = 0;
  mouseMovements = 0;
  _interactionCount = 0;
  suspiciousPatterns = 0;
  _visibilityChanges = 0;
  console.log('⏰ Timer started at:', loginStartTime);
};

// Track typing with better metrics
const trackTyping = () => {
  keyPressCount++;
  if (firstKeyPressTime === null) {
    firstKeyPressTime = Date.now();
    console.log('⌨️ First key press at:', firstKeyPressTime);
  }
  
  // Detect suspicious patterns
  if (keyPressCount > 50 && (Date.now() - firstKeyPressTime) < 2000) {
    suspiciousPatterns++;
    console.log('⚠️ Suspicious: Too many keys in short time');
  }
  
  console.log('⌨️ Key press count:', keyPressCount);
};

// Track mouse movements (humans move mouse, bots often don't)
const trackInteraction = () => {
  mouseMovements++;
  _interactionCount++;
  
  // Humans typically have mouse movements before typing
  if (mouseMovements === 1 && keyPressCount === 0) {
    console.log('🖱️ Mouse movement detected before typing');
  }
};

// Track page visibility (bots often run in background)
const trackVisibility = () => {
  if (document.hidden) {
    _visibilityChanges++;
    console.log('👁️ Page hidden - possible human behavior');
  }
};

// Add visibility change listener
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', trackVisibility);
}

// Check for browser automation
const detectAutomation = () => {
  const automationIndicators = [];
  
  // Check for common automation properties
  if (typeof navigator !== 'undefined' && navigator.webdriver === true) automationIndicators.push('webdriver');
  if (typeof window !== 'undefined') {
    if (window.callPhantom || window._phantom) automationIndicators.push('phantomjs');
    if (window.__webdriver_evaluate) automationIndicators.push('webdriver_evaluate');
    if (window.__selenium_evaluate) automationIndicators.push('selenium_evaluate');
    if (window.__webdriver_script_function) automationIndicators.push('webdriver_script');
    if (window.__webdriver_script_func) automationIndicators.push('webdriver_script_func');
    if (window.__webdriver_script_fn) automationIndicators.push('webdriver_script_fn');
    if (window.__fxdriver_evaluate) automationIndicators.push('fxdriver_evaluate');
    if (window.__driver_unwrapped) automationIndicators.push('driver_unwrapped');
    if (window.__webdriver_unwrapped) automationIndicators.push('webdriver_unwrapped');
    if (window.__selenium_unwrapped) automationIndicators.push('selenium_unwrapped');
    if (window.__webdriver_wdcb) automationIndicators.push('webdriver_wdcb');
  }
  
  return automationIndicators;
};

// Check typing speed with human limits
const checkTypingSpeed = () => {
  if (keyPressCount === 0) return true; // No typing is fine
  
  const timeSpent = (Date.now() - firstKeyPressTime) / 1000;
  if (timeSpent === 0) return false;
  
  const speed = keyPressCount / timeSpent;
  
  // Human typing speeds:
  // Slow: 2-3 keys/sec (hunt and peck)
  // Average: 4-6 keys/sec (typical typist)
  // Fast: 7-9 keys/sec (expert typist)
  // Superhuman: 10+ keys/sec (bot or cheating)
  
  const isHumanSpeed = speed <= 12; // INCREASED from 9.5 to 12 (allows very fast typists)
  const isMinimumTyping = keyPressCount >= 3 ? speed > 0.5 : true; // At least half a key per second if typed
  
  console.log(`⚡ Typing speed: ${speed.toFixed(1)} keys/sec - ${isHumanSpeed ? 'HUMAN' : 'BOT'}`);
  
  return isHumanSpeed && isMinimumTyping;
};

// Main check - Multi-factor bot detection (MODIFIED - NO TIME-ON-PAGE BLOCKING)
const checkAntiBot = () => {
  // Check if timer was started
  if (loginStartTime === null) {
    console.log('⚠️ Anti-bot timer not started, starting now...');
    startTimer();
  }
  
  // Check for automation tools
  const automationIndicators = detectAutomation();
  if (automationIndicators.length > 0) {
    console.log('🚫 BOT DETECTED: Automation indicators found:', automationIndicators);
    return { 
      passed: false, 
      reason: `Automation detected: ${automationIndicators.join(', ')}`,
      isBot: true 
    };
  }
  
  // Check for suspicious patterns
  if (suspiciousPatterns > 2) {
    console.log('🚫 BOT DETECTED: Multiple suspicious typing patterns');
    return { 
      passed: false, 
      reason: 'Suspicious typing patterns detected',
      isBot: true 
    };
  }
  
  // If user never typed anything, ALWAYS PASS (don't block just for looking at page)
  if (keyPressCount === 0) {
    console.log('✅ No typing detected - PASS (user just viewing page)');
    return { passed: true, reason: 'No typing required' };
  }
  
  // Check typing speed (ONLY block if typing is inhumanly fast)
  const hasReasonableSpeed = checkTypingSpeed();
  if (!hasReasonableSpeed && keyPressCount >= 3) {
    console.log('🚫 BOT DETECTED: Unreasonable typing speed');
    const timeSpent = (Date.now() - firstKeyPressTime) / 1000;
    const speed = keyPressCount / timeSpent;
    return { 
      passed: false, 
      reason: `Typing speed too fast: ${speed.toFixed(1)} keys/sec`,
      isBot: true 
    };
  }
  
  // If they typed but had mouse movement, they're human
  if (keyPressCount > 0 && mouseMovements > 0) {
    console.log('✅ Human confirmed: Typing + Mouse movement detected');
    return { 
      passed: true, 
      reason: `Human verified - ${keyPressCount} keys, ${mouseMovements} mouse movements`,
      isBot: false 
    };
  }
  
  // If they typed and took reasonable time (not instant)
  const timeFromFirstKey = (Date.now() - firstKeyPressTime) / 1000;
  if (keyPressCount > 0 && timeFromFirstKey >= 1.5) {
    console.log('✅ Human confirmed: Reasonable typing time');
    return { 
      passed: true, 
      reason: `Human verified - took ${timeFromFirstKey.toFixed(1)} seconds to type`,
      isBot: false 
    };
  }
  
  // Default: PASS (don't block real users)
  console.log('✅ Anti-bot check PASSED');
  return { 
    passed: true, 
    reason: 'Human behavior confirmed',
    isBot: false 
  };
};

// Reset everything
const resetAntiBot = () => {
  loginStartTime = null;
  firstKeyPressTime = null;
  keyPressCount = 0;
  mouseMovements = 0;
  _interactionCount = 0;
  suspiciousPatterns = 0;
  _visibilityChanges = 0;
  console.log('🔄 Anti-bot reset');
};

// Cleanup function to remove event listener
const cleanupAntiBot = () => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', trackVisibility);
  }
  resetAntiBot();
};

export {
  startTimer,
  trackInteraction,
  trackTyping,
  checkAntiBot,
  resetAntiBot,
  cleanupAntiBot
};