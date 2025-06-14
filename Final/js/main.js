// ===== MAIN JAVASCRIPT FILE =====
// This file demonstrates all required JavaScript functionality for WDD 231

// ===== IMPORTS =====
import { loadArtists, displayFeaturedArtists } from './artists.js';
import { loadEvents, displayUpcomingEvents } from './events.js';

// ===== GLOBAL VARIABLES AND OBJECTS ===== 
const config = {
    maxFeaturedArtists: 3,
    maxUpcomingEvents: 2,
    animationDuration: 300,
    scrollThreshold: 300
};

const elements = {
    navToggle: null,
    navMenu: null,
    backToTop: null,
    currentYear: null,
    lastModified: null,
    form: null
};

const formValidation = {
    name: false,
    email: false,
    medium: false,
    experience: false,
    bio: false,
    terms: false
};

// ===== ARRAYS FOR DATA STORAGE =====
let featuredArtists = [];
let upcomingEvents = [];
let formSubmissions = [];

// ===== MAIN INITIALIZATION FUNCTION =====
async function initializeApp() {
    try {
        // Initialize DOM elements
        initializeElements();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load and display content (only on appropriate pages)
        await loadContent();
        
        // Initialize other features
        initializeFooterDates();
        initializeBackToTop();
        restoreUserPreferences();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// ===== DOM ELEMENT INITIALIZATION =====
function initializeElements() {
    elements.navToggle = document.getElementById('nav-toggle');
    elements.navMenu = document.getElementById('nav-menu');
    elements.backToTop = document.getElementById('back-to-top');
    elements.currentYear = document.getElementById('current-year');
    elements.lastModified = document.getElementById('last-modified');
    elements.form = document.getElementById('artist-submission-form');
}

// ===== EVENT LISTENERS SETUP =====
function setupEventListeners() {
    // Navigation toggle
    if (elements.navToggle && elements.navMenu) {
        elements.navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Back to top button
    if (elements.backToTop) {
        elements.backToTop.addEventListener('click', scrollToTop);
    }
    
    // Scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Form submission
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmission);
        setupFormValidation();
    }
    
    // Window resize for responsive adjustments
    window.addEventListener('resize', handleResize);
    
    // Page visibility for analytics
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

// ===== NAVIGATION FUNCTIONS =====
function toggleMobileMenu() {
    // Conditional branching for menu state
    const isActive = elements.navMenu.classList.contains('active');
    
    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
    
    // Save user interaction
    saveUserPreference('menuInteractions', getUserPreference('menuInteractions', 0) + 1);
}

function openMobileMenu() {
    elements.navMenu.classList.add('active');
    elements.navToggle.classList.add('active');
    elements.navToggle.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    elements.navMenu.classList.remove('active');
    elements.navToggle.classList.remove('active');
    elements.navToggle.setAttribute('aria-expanded', 'false');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// ===== CONTENT LOADING FUNCTIONS =====
async function loadContent() {
    try {
        // Check if we're on the homepage (where we need to load featured content)
        const isHomepage = window.location.pathname.includes('index.html') || 
                          window.location.pathname === '/' || 
                          window.location.pathname.endsWith('/');
        
        if (!isHomepage) {
            // Not on homepage, skip content loading
            return;
        }
        
        // Only load content if the containers exist
        const featuredContainer = document.getElementById('featured-artist-grid');
        const eventsContainer = document.getElementById('events-preview');
        
        if (!featuredContainer && !eventsContainer) {
            // No containers found, skip loading
            return;
        }
        
        // Load data using fetch and async/await
        const [artistsData, eventsData] = await Promise.all([
            loadArtists(),
            loadEvents()
        ]);
        
        // Filter featured artists using array methods
        if (featuredContainer && artistsData.length > 0) {
            featuredArtists = artistsData.filter(artist => artist.featured === true)
                .slice(0, config.maxFeaturedArtists);
            displayFeaturedArtists(featuredArtists);
        }
        
        // Sort and filter upcoming events
        if (eventsContainer && eventsData.length > 0) {
            const now = new Date();
            upcomingEvents = eventsData
                .filter(event => new Date(event.date) > now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, config.maxUpcomingEvents);
            displayUpcomingEvents(upcomingEvents);
        }
        
    } catch (error) {
        console.error('Error loading content:', error);
        displayErrorMessage('Failed to load content. Please try refreshing the page.');
    }
}

// ===== FORM HANDLING FUNCTIONS =====
function setupFormValidation() {
    const formInputs = elements.form.querySelectorAll('input, select, textarea');
    
    // Add event listeners to all form inputs
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
        
        // Special handling for textarea character count
        if (input.type === 'textarea' || input.tagName === 'TEXTAREA') {
            input.addEventListener('input', updateCharacterCount);
        }
    });
}

function validateField(event) {
    const field = event.target;
    const fieldName = field.name;
    const value = field.value.trim();
    
    // Conditional branching for different field types
    switch (fieldName) {
        case 'artistName':
            formValidation.name = validateName(value);
            displayFieldError(field, formValidation.name, 'Please enter your full name');
            break;
        case 'email':
            formValidation.email = validateEmail(value);
            displayFieldError(field, formValidation.email, 'Please enter a valid email address');
            break;
        case 'medium':
            formValidation.medium = value !== '';
            displayFieldError(field, formValidation.medium, 'Please select your art medium');
            break;
        case 'experience':
            formValidation.experience = value !== '';
            displayFieldError(field, formValidation.experience, 'Please select your experience level');
            break;
        case 'bio':
            formValidation.bio = validateBio(value);
            displayFieldError(field, formValidation.bio, 'Please provide a brief bio (at least 50 characters)');
            break;
        case 'terms':
            formValidation.terms = field.checked;
            displayFieldError(field, formValidation.terms, 'You must agree to the terms and conditions');
            break;
    }
    
    updateSubmitButtonState();
}

function validateName(name) {
    return name.length >= 2 && name.includes(' ');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateBio(bio) {
    return bio.length >= 50 && bio.length <= 500;
}

function displayFieldError(field, isValid, errorMessage) {
    const errorElement = document.getElementById(`${field.name.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`);
    
    if (errorElement) {
        // Template literal for error display
        errorElement.textContent = isValid ? '' : errorMessage;
        errorElement.style.display = isValid ? 'none' : 'block';
    }
    
    // Visual feedback on field
    field.classList.toggle('error', !isValid);
}

function clearFieldError(event) {
    const field = event.target;
    const errorElement = document.getElementById(`${field.name.replace(/([A-Z])/g, '-$1').toLowerCase()}-error`);
    
    if (errorElement && field.value.trim()) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        field.classList.remove('error');
    }
}

function updateCharacterCount(event) {
    const textarea = event.target;
    const countElement = document.getElementById('bio-count');
    const currentLength = textarea.value.length;
    const maxLength = 500;
    
    if (countElement) {
        // Template literal for character count
        countElement.textContent = `${currentLength}/${maxLength} characters`;
        countElement.style.color = currentLength > maxLength ? 'var(--error-color)' : 'var(--medium-gray)';
    }
}

function updateSubmitButtonState() {
    const submitButton = elements.form.querySelector('.btn-submit');
    const allValid = Object.values(formValidation).every(isValid => isValid === true);
    
    if (submitButton) {
        submitButton.disabled = !allValid;
        submitButton.style.opacity = allValid ? '1' : '0.6';
        submitButton.style.cursor = allValid ? 'pointer' : 'not-allowed';
    }
}

async function handleFormSubmission(event) {
    event.preventDefault();
    
    // Validate all fields
    const formData = new FormData(elements.form);
    const submissionData = Object.fromEntries(formData.entries());
    
    // Check if all validations pass
    const allValid = Object.values(formValidation).every(isValid => isValid === true);
    
    if (!allValid) {
        displayFormMessage('Please correct the errors before submitting.', 'error');
        return;
    }
    
    try {
        // Simulate form submission
        await simulateFormSubmission(submissionData);
        
        // Add to submissions array
        const submission = {
            ...submissionData,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            status: 'pending'
        };
        
        formSubmissions.push(submission);
        
        // Save to localStorage
        saveFormSubmissions();
        
        // Success feedback
        displayFormMessage('Thank you! Your application has been submitted successfully.', 'success');
        elements.form.reset();
        resetFormValidation();
        
    } catch (error) {
        console.error('Form submission error:', error);
        displayFormMessage('There was an error submitting your application. Please try again.', 'error');
    }
}

function simulateFormSubmission(data) {
    // Simulate async operation
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate 90% success rate
            if (Math.random() > 0.1) {
                resolve(data);
            } else {
                reject(new Error('Network error'));
            }
        }, 1000);
    });
}

function displayFormMessage(message, type) {
    // Create or update message element
    let messageElement = document.getElementById('form-message');
    
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'form-message';
        elements.form.insertBefore(messageElement, elements.form.firstChild);
    }
    
    // Template literal for message styling
    messageElement.innerHTML = `
        <div class="form-message ${type}">
            ${message}
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (messageElement) {
            messageElement.remove();
        }
    }, 5000);
}

function resetFormValidation() {
    // Reset validation object
    Object.keys(formValidation).forEach(key => {
        formValidation[key] = false;
    });
    
    updateSubmitButtonState();
}

// ===== SCROLL FUNCTIONS =====
function handleScroll() {
    const scrollY = window.pageYOffset;
    
    // Back to top button visibility
    toggleBackToTopVisibility(scrollY);
    
    // Save scroll position
    saveUserPreference('lastScrollPosition', scrollY);
    
    // Parallax effect for hero section (if on homepage)
    applyParallaxEffect(scrollY);
}

function toggleBackToTopVisibility(scrollY) {
    if (!elements.backToTop) return;
    
    // Conditional branching for button visibility
    const shouldShow = scrollY > config.scrollThreshold;
    
    if (shouldShow && !elements.backToTop.classList.contains('visible')) {
        elements.backToTop.classList.add('visible');
    } else if (!shouldShow && elements.backToTop.classList.contains('visible')) {
        elements.backToTop.classList.remove('visible');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // Track usage
    const backToTopUsage = getUserPreference('backToTopUsage', 0);
    saveUserPreference('backToTopUsage', backToTopUsage + 1);
}

function applyParallaxEffect(scrollY) {
    const heroImage = document.querySelector('.hero-image img');
    
    if (heroImage && scrollY < window.innerHeight) {
        const parallaxSpeed = 0.5;
        const yPos = -(scrollY * parallaxSpeed);
        heroImage.style.transform = `translateY(${yPos}px)`;
    }
}

// ===== UTILITY FUNCTIONS =====
function initializeFooterDates() {
    // Set current year
    if (elements.currentYear) {
        elements.currentYear.textContent = new Date().getFullYear();
    }
    
    // Set last modified date
    if (elements.lastModified) {
        const lastModified = new Date(document.lastModified);
        elements.lastModified.textContent = formatDate(lastModified);
    }
}

function formatDate(date) {
    // Template literal for date formatting
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
}

function initializeBackToTop() {
    // Initialize based on current scroll position
    toggleBackToTopVisibility(window.pageYOffset);
}

function handleResize() {
    // Close mobile menu on resize to prevent issues
    if (window.innerWidth > 991 && elements.navMenu.classList.contains('active')) {
        closeMobileMenu();
    }
    
    // Update layout calculations if needed
    updateLayoutCalculations();
}

function updateLayoutCalculations() {
    // Recalculate any dynamic layouts
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Save viewport dimensions for other functions
    saveUserPreference('viewportDimensions', {
        width: viewportWidth,
        height: viewportHeight,
        timestamp: Date.now()
    });
}

function handleVisibilityChange() {
    // Track page visibility for analytics
    const visibilityState = document.visibilityState;
    const timestamp = new Date().toISOString();
    
    if (visibilityState === 'visible') {
        saveUserPreference('lastPageView', timestamp);
    } else {
        const sessionData = getUserPreference('sessionData', {});
        sessionData.lastHidden = timestamp;
        saveUserPreference('sessionData', sessionData);
    }
}

function displayErrorMessage(message) {
    // Create error display element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message-global';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 10000);
}

// ===== LOCAL STORAGE FUNCTIONS =====
function saveUserPreference(key, value) {
    try {
        localStorage.setItem(`artistSpotlight_${key}`, JSON.stringify(value));
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function getUserPreference(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(`artistSpotlight_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.warn('Could not read from localStorage:', error);
        return defaultValue;
    }
}

function saveFormSubmissions() {
    saveUserPreference('formSubmissions', formSubmissions);
}

function loadFormSubmissions() {
    formSubmissions = getUserPreference('formSubmissions', []);
}

function restoreUserPreferences() {
    // Restore scroll position if available
    const lastScrollPosition = getUserPreference('lastScrollPosition', 0);
    
    if (lastScrollPosition > 0) {
        // Smooth scroll to last position after content loads
        setTimeout(() => {
            window.scrollTo({
                top: lastScrollPosition,
                behavior: 'smooth'
            });
        }, 500);
    }
    
    // Load form submissions
    loadFormSubmissions();
    
    // Track return visitor
    const visitCount = getUserPreference('visitCount', 0);
    saveUserPreference('visitCount', visitCount + 1);
    
    // Track user preferences
    const preferences = getUserPreference('userPreferences', {});
    preferences.lastVisit = new Date().toISOString();
    preferences.userAgent = navigator.userAgent;
    preferences.language = navigator.language;
    saveUserPreference('userPreferences', preferences);
}

function clearUserData() {
    // Function to clear all stored user data
    const keys = Object.keys(localStorage).filter(key => key.startsWith('artistSpotlight_'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log('User data cleared');
}

// ===== ANALYTICS AND TRACKING =====
function trackUserInteraction(action, element, data = {}) {
    const interaction = {
        action,
        element: element.tagName || element,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        ...data
    };
    
    // Store interaction data
    const interactions = getUserPreference('userInteractions', []);
    interactions.push(interaction);
    
    // Keep only last 100 interactions
    if (interactions.length > 100) {
        interactions.splice(0, interactions.length - 100);
    }
    
    saveUserPreference('userInteractions', interactions);
}

function generateUserReport() {
    // Function to generate user activity report
    const visitCount = getUserPreference('visitCount', 0);
    const interactions = getUserPreference('userInteractions', []);
    const formSubmissions = getUserPreference('formSubmissions', []);
    const preferences = getUserPreference('userPreferences', {});
    
    const report = {
        visitCount,
        totalInteractions: interactions.length,
        formSubmissions: formSubmissions.length,
        lastVisit: preferences.lastVisit,
        mostUsedFeatures: analyzeInteractions(interactions),
        averageSessionTime: calculateAverageSessionTime(interactions)
    };
    
    console.log('User Activity Report:', report);
    return report;
}

function analyzeInteractions(interactions) {
    // Use array methods to analyze interaction patterns
    const actionCounts = interactions.reduce((acc, interaction) => {
        acc[interaction.action] = (acc[interaction.action] || 0) + 1;
        return acc;
    }, {});
    
    // Sort by frequency and return top 5
    return Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count }));
}

function calculateAverageSessionTime(interactions) {
    if (interactions.length < 2) return 0;
    
    const sessions = [];
    let sessionStart = new Date(interactions[0].timestamp);
    
    for (let i = 1; i < interactions.length; i++) {
        const currentTime = new Date(interactions[i].timestamp);
        const timeDiff = currentTime - sessionStart;
        
        // If more than 30 minutes gap, consider it a new session
        if (timeDiff > 30 * 60 * 1000) {
            sessionStart = currentTime;
        } else if (i === interactions.length - 1) {
            sessions.push(timeDiff);
        }
    }
    
    // Calculate average session time in minutes
    const totalTime = sessions.reduce((sum, time) => sum + time, 0);
    return sessions.length > 0 ? Math.round(totalTime / sessions.length / 60000) : 0;
}

// ===== PERFORMANCE MONITORING =====
function measurePagePerformance() {
    // Use Performance API to measure page load times
    if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        const performanceMetrics = {
            pageLoadTime: perfData.loadEventEnd - perfData.fetchStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
            firstPaint: getFirstPaint(),
            timestamp: new Date().toISOString()
        };
        
        saveUserPreference('performanceMetrics', performanceMetrics);
        console.log('Performance Metrics:', performanceMetrics);
    }
}

function getFirstPaint() {
    // Get First Paint timing
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
}

// ===== ERROR HANDLING =====
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        const errorData = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store error for debugging
        const errors = getUserPreference('jsErrors', []);
        errors.push(errorData);
        
        // Keep only last 10 errors
        if (errors.length > 10) {
            errors.splice(0, errors.length - 10);
        }
        
        saveUserPreference('jsErrors', errors);
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        const rejectionData = {
            reason: event.reason?.toString(),
            stack: event.reason?.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        const rejections = getUserPreference('promiseRejections', []);
        rejections.push(rejectionData);
        
        if (rejections.length > 10) {
            rejections.splice(0, rejections.length - 10);
        }
        
        saveUserPreference('promiseRejections', rejections);
    });
}

// ===== LAZY LOADING ENHANCEMENT =====
function initializeLazyLoading() {
    // Enhanced lazy loading with intersection observer
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Handle loading states
                    img.classList.add('loading');
                    
                    img.addEventListener('load', () => {
                        img.classList.remove('loading');
                        img.classList.add('loaded');
                    });
                    
                    img.addEventListener('error', () => {
                        img.classList.remove('loading');
                        img.classList.add('error');
                        // Fallback image could be set here
                    });
                    
                    observer.unobserve(img);
                }
            });
        });
        
        // Observe all images with loading="lazy"
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
function initializeAccessibility() {
    // Skip links for keyboard navigation
    addSkipLinks();
    
    // Focus management
    setupFocusManagement();
    
    // ARIA live regions for dynamic content
    setupLiveRegions();
    
    // High contrast mode detection
    detectHighContrastMode();
}

function addSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#navigation" class="skip-link">Skip to navigation</a>
    `;
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
}

function setupFocusManagement() {
    // Trap focus in modal dialogs
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            // Close any open modals or menus
            if (elements.navMenu.classList.contains('active')) {
                closeMobileMenu();
                elements.navToggle.focus();
            }
        }
    });
}

function setupLiveRegions() {
    // Create ARIA live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
}

function announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
        liveRegion.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    }
}

function detectHighContrastMode() {
    // Detect Windows High Contrast Mode
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
        saveUserPreference('highContrastMode', true);
    }
}

// ===== EXPORT FUNCTIONS FOR OTHER MODULES =====
export {
    saveUserPreference,
    getUserPreference,
    trackUserInteraction,
    announceToScreenReader,
    displayErrorMessage
};

// ===== INITIALIZATION =====
// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded
    initializeApp();
}

// Initialize additional features
setupErrorHandling();
measurePagePerformance();

// Initialize when page becomes visible
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initializeLazyLoading();
        initializeAccessibility();
    }
});

// Development helper functions (only available when needed)
// Removed the problematic process.env check that was causing the error
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '';

if (isDevelopment) {
    window.debugFunctions = {
        generateUserReport,
        clearUserData,
        measurePagePerformance,
        config,
        elements,
        formValidation
    };
}