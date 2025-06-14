// ===== ARTISTS MODULE =====
// This module handles all artist-related functionality

// ===== IMPORTS =====
import { saveUserPreference, getUserPreference, trackUserInteraction } from './main.js';

// ===== GLOBAL VARIABLES =====
let allArtists = [];
let filteredArtists = [];
let currentFilter = 'all';

// Artist categories for filtering
const artistCategories = [
    { value: 'all', label: 'All Artists', count: 0 },
    { value: 'painting', label: 'Painting', count: 0 },
    { value: 'sculpture', label: 'Sculpture', count: 0 },
    { value: 'photography', label: 'Photography', count: 0 },
    { value: 'digital-art', label: 'Digital Art', count: 0 },
    { value: 'mixed-media', label: 'Mixed Media', count: 0 },
    { value: 'ceramics', label: 'Ceramics', count: 0 },
    { value: 'textiles', label: 'Textiles', count: 0 },
    { value: 'jewelry', label: 'Jewelry', count: 0 }
];

// ===== LOAD ARTISTS DATA =====
async function loadArtists() {
    try {
        // Check for cached data first
        const cachedArtists = getUserPreference('cachedArtists', null);
        const cacheTimestamp = getUserPreference('artistsCacheTimestamp', 0);
        const now = Date.now();
        const cacheExpiry = 15 * 60 * 1000; // 15 minutes
        
        // Use cached data if still fresh
        if (cachedArtists && (now - cacheTimestamp) < cacheExpiry) {
            allArtists = cachedArtists;
            return allArtists;
        }
        
        // Fetch fresh data from JSON file
        const response = await fetch('data/artists.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allArtists = data.artists || data; // Handle different JSON structures
        
        // Cache the data
        saveUserPreference('cachedArtists', allArtists);
        saveUserPreference('artistsCacheTimestamp', now);
        
        // Process artist data
        processArtistData();
        
        return allArtists;
        
    } catch (error) {
        console.error('Error loading artists:', error);
        
        // Show user-friendly error message
        showDataLoadError('artists');
        
        // Return empty array to prevent crashes
        allArtists = [];
        return allArtists;
    }
}

// ===== ERROR HANDLING =====
function showDataLoadError(dataType) {
    const container = document.getElementById(`${dataType}-container`) || 
                    document.getElementById('artists-container');
    
    if (container) {
        container.innerHTML = `
            <div class="data-load-error">
                <div class="error-icon">⚠️</div>
                <h3>Unable to Load ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}</h3>
                <p>We're having trouble loading the ${dataType} data. This could be due to:</p>
                <ul>
                    <li>Network connectivity issues</li>
                    <li>Missing data file (data/${dataType}.json)</li>
                    <li>Server configuration problems</li>
                </ul>
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn btn-primary">
                        Try Again
                    </button>
                    <button onclick="this.parentElement.parentElement.style.display='none'" 
                            class="btn btn-outline">
                        Dismiss
                    </button>
                </div>
                <details class="error-details">
                    <summary>Technical Details</summary>
                    <p>Make sure the <code>data/${dataType}.json</code> file exists and is accessible from your web server.</p>
                </details>
            </div>
        `;
    }
}

// ===== PROCESS ARTIST DATA =====
function processArtistData() {
    // Add computed properties to each artist
    allArtists = allArtists.map(artist => ({
        ...artist,
        id: artist.id || generateArtistId(artist),
        displayName: formatArtistName(artist.name),
        portfolioCount: artist.portfolio ? artist.portfolio.length : 0,
        joinedDate: artist.dateJoined || new Date().toISOString(),
        lastActive: artist.lastActive || new Date().toISOString(),
        rating: artist.rating || calculateArtistRating(artist),
        tags: generateArtistTags(artist)
    }));
    
    // Update category counts
    updateCategoryCounts();
    
    // Sort artists by featured status and rating
    allArtists.sort((a, b) => {
        // Featured artists first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        
        // Then by rating
        return b.rating - a.rating;
    });
}

// ===== DISPLAY FEATURED ARTISTS =====
function displayFeaturedArtists(artists) {
    const container = document.getElementById('featured-artist-grid');
    
    if (!container) {
        // Container doesn't exist on this page, which is normal
        return;
    }
    
    if (!artists || artists.length === 0) {
        container.innerHTML = `
            <div class="no-featured-artists">
                <p>No featured artists available at the moment.</p>
                <a href="artists.html" class="btn btn-outline">Browse All Artists</a>
            </div>
        `;
        return;
    }
    
    // Template literal to build HTML
    const artistsHTML = artists.map(artist => createArtistCardHTML(artist, true)).join('');
    
    container.innerHTML = artistsHTML;
    
    // Add event listeners to artist cards
    addArtistCardListeners(container);
    
    // Track display
    trackUserInteraction('featured_artists_displayed', 'section', {
        count: artists.length,
        artists: artists.map(a => a.id)
    });
}

// ===== DISPLAY ALL ARTISTS (for artists.html page) =====
function displayAllArtists(container, filters = {}) {
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading amazing local artists...</p>
        </div>
    `;
    
    // Apply filters
    filteredArtists = filterArtists(allArtists, filters);
    
    if (filteredArtists.length === 0) {
        container.innerHTML = createNoResultsHTML();
        return;
    }
    
    // Create artists grid HTML
    const artistsHTML = filteredArtists.map(artist => 
        createArtistCardHTML(artist, false)
    ).join('');
    
    container.innerHTML = `
        <div class="artists-grid">
            ${artistsHTML}
        </div>
    `;
    
    // Add event listeners
    addArtistCardListeners(container);
    
    // Update results count
    updateResultsCount(filteredArtists.length, allArtists.length);
    
    // Save current filter
    saveUserPreference('lastArtistFilter', filters);
}

// ===== FILTER ARTISTS =====
function filterArtists(artists, filters) {
    let filtered = [...artists];
    
    // Filter by medium
    if (filters.medium && filters.medium !== 'all') {
        filtered = filtered.filter(artist => 
            artist.medium === filters.medium ||
            (artist.secondaryMediums && artist.secondaryMediums.includes(filters.medium))
        );
    }
    
    // Filter by availability
    if (filters.availability === 'available') {
        filtered = filtered.filter(artist => artist.available === true);
    }
    
    // Filter by experience level
    if (filters.experience) {
        filtered = filtered.filter(artist => artist.experience === filters.experience);
    }
    
    // Filter by featured status
    if (filters.featured === 'true') {
        filtered = filtered.filter(artist => artist.featured === true);
    }
    
    // Search by name or bio
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(artist => 
            artist.name.toLowerCase().includes(searchTerm) ||
            artist.bio.toLowerCase().includes(searchTerm) ||
            artist.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort results
    if (filters.sortBy) {
        filtered = sortArtists(filtered, filters.sortBy);
    }
    
    return filtered;
}

// ===== SORT ARTISTS =====
function sortArtists(artists, sortBy) {
    const sortedArtists = [...artists];
    
    switch (sortBy) {
        case 'name':
            return sortedArtists.sort((a, b) => a.name.localeCompare(b.name));
        case 'newest':
            return sortedArtists.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate));
        case 'rating':
            return sortedArtists.sort((a, b) => b.rating - a.rating);
        case 'portfolio':
            return sortedArtists.sort((a, b) => b.portfolioCount - a.portfolioCount);
        default:
            return sortedArtists;
    }
}

// ===== CREATE ARTIST CARD HTML =====
function createArtistCardHTML(artist, isFeatured = false) {
    const statusClass = artist.available ? 'status-available' : 'status-busy';
    const statusText = artist.available ? 'Available' : 'Busy';
    const featuredBadge = artist.featured ? '<span class="artist-status status-featured">Featured</span>' : '';
    
    // Template literal for artist card
    return `
        <article class="artist-card ${isFeatured ? 'featured' : ''}" 
                 data-artist-id="${artist.id}" 
                 data-medium="${artist.medium}"
                 data-available="${artist.available}"
                 tabindex="0"
                 role="button"
                 aria-label="View ${artist.name}'s profile">
            <div class="artist-image">
                <img src="${artist.photo}" 
                     alt="${artist.name} - ${artist.medium} artist" 
                     loading="lazy"
                     onerror="this.src='images/placeholder-artist.webp'">
                ${featuredBadge}
            </div>
            <div class="artist-card-content">
                <h3 class="artist-name">${artist.displayName}</h3>
                <p class="artist-medium">${formatMedium(artist.medium)}</p>
                <p class="artist-bio">${truncateBio(artist.bio, 100)}</p>
                <div class="artist-meta">
                    <span class="artist-status ${statusClass}">${statusText}</span>
                    <span class="artist-portfolio-count">${artist.portfolioCount} works</span>
                    <span class="artist-rating" aria-label="Rating ${artist.rating} out of 5">
                        ${'★'.repeat(Math.floor(artist.rating))}${'☆'.repeat(5 - Math.floor(artist.rating))}
                    </span>
                </div>
                <div class="artist-contact">
                    ${artist.website ? `<a href="${artist.website}" target="_blank" rel="noopener" class="artist-website">Portfolio</a>` : ''}
                    ${artist.email ? `<a href="mailto:${artist.email}" class="artist-email">Contact</a>` : ''}
                </div>
            </div>
        </article>
    `;
}

// ===== UTILITY FUNCTIONS =====
function generateArtistId(artist) {
    // Generate unique ID based on name and email
    const nameSlug = artist.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const emailHash = artist.email ? btoa(artist.email).slice(0, 6) : 'unknown';
    return `${nameSlug}-${emailHash}`;
}

function formatArtistName(name) {
    // Format artist name for display
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function formatMedium(medium) {
    // Format medium for display
    const mediumMap = {
        'mixed-media': 'Mixed Media',
        'digital-art': 'Digital Art',
        'photography': 'Photography',
        'painting': 'Painting',
        'sculpture': 'Sculpture',
        'ceramics': 'Ceramics',
        'textiles': 'Textiles',
        'jewelry': 'Jewelry'
    };
    
    return mediumMap[medium] || medium.charAt(0).toUpperCase() + medium.slice(1);
}

function truncateBio(bio, maxLength) {
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength).trim() + '...';
}

function calculateArtistRating(artist) {
    // Calculate rating based on various factors
    let rating = 3; // Base rating
    
    if (artist.featured) rating += 1;
    if (artist.portfolio && artist.portfolio.length > 10) rating += 0.5;
    if (artist.experience === 'professional') rating += 0.5;
    if (artist.website) rating += 0.3;
    
    return Math.min(5, Math.max(1, rating));
}

function generateArtistTags(artist) {
    const tags = [artist.medium];
    
    if (artist.featured) tags.push('featured');
    if (artist.available) tags.push('available');
    if (artist.experience) tags.push(artist.experience);
    if (artist.location) tags.push(artist.location.toLowerCase());
    
    // Add tags based on bio keywords
    const bioKeywords = ['contemporary', 'traditional', 'abstract', 'realistic', 'experimental'];
    bioKeywords.forEach(keyword => {
        if (artist.bio.toLowerCase().includes(keyword)) {
            tags.push(keyword);
        }
    });
    
    return [...new Set(tags)]; // Remove duplicates
}

function updateCategoryCounts() {
    // Update category counts for filters
    artistCategories.forEach(category => {
        if (category.value === 'all') {
            category.count = allArtists.length;
        } else {
            category.count = allArtists.filter(artist => 
                artist.medium === category.value ||
                (artist.secondaryMediums && artist.secondaryMediums.includes(category.value))
            ).length;
        }
    });
}

function updateResultsCount(filteredCount, totalCount) {
    const countElement = document.getElementById('results-count');
    if (countElement) {
        countElement.textContent = `Showing ${filteredCount} of ${totalCount} artists`;
    }
}

function createNoResultsHTML() {
    return `
        <div class="no-results">
            <h3>No artists found</h3>
            <p>Try adjusting your filters or search terms.</p>
            <button onclick="clearFilters()" class="btn btn-outline">Clear Filters</button>
        </div>
    `;
}

// ===== EVENT HANDLERS =====
function addArtistCardListeners(container) {
    const artistCards = container.querySelectorAll('.artist-card');
    
    artistCards.forEach(card => {
        // Click handler
        card.addEventListener('click', handleArtistCardClick);
        
        // Keyboard handler
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleArtistCardClick.call(card, event);
            }
        });
        
        // Hover tracking
        card.addEventListener('mouseenter', () => {
            trackUserInteraction('artist_card_hover', card, {
                artistId: card.dataset.artistId,
                medium: card.dataset.medium
            });
        });
    });
}

function handleArtistCardClick(event) {
    // Prevent click if clicking on links
    if (event.target.tagName === 'A') return;
    
    const artistId = this.dataset.artistId;
    const artist = allArtists.find(a => a.id === artistId);
    
    if (artist) {
        // Track interaction
        trackUserInteraction('artist_card_click', this, {
            artistId,
            medium: artist.medium,
            featured: artist.featured
        });
        
        // Show artist details modal or navigate to profile
        showArtistDetails(artist);
        
        // Save recently viewed
        saveRecentlyViewed(artist);
    }
}

function showArtistDetails(artist) {
    // Create and show artist details modal
    const modal = createArtistModal(artist);
    document.body.appendChild(modal);
    
    // Add close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // ESC key handler
    document.addEventListener('keydown', handleModalKeydown);
    
    // Focus management
    modal.querySelector('.modal-content').focus();
    
    function closeModal() {
        modal.remove();
        document.removeEventListener('keydown', handleModalKeydown);
    }
    
    function handleModalKeydown(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
}

function createArtistModal(artist) {
    const modal = document.createElement('div');
    modal.className = 'artist-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" tabindex="-1" role="dialog" aria-labelledby="modal-title">
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-body">
                <div class="artist-detail-image">
                    <img src="${artist.photo}" alt="${artist.name}">
                </div>
                <div class="artist-detail-info">
                    <h2 id="modal-title">${artist.displayName}</h2>
                    <p class="artist-medium">${formatMedium(artist.medium)}</p>
                    <p class="artist-bio">${artist.bio}</p>
                    <div class="artist-meta">
                        <span class="artist-experience">Experience: ${artist.experience}</span>
                        <span class="artist-rating">Rating: ${'★'.repeat(Math.floor(artist.rating))}</span>
                    </div>
                    <div class="artist-portfolio">
                        <h3>Portfolio (${artist.portfolioCount} works)</h3>
                        <div class="portfolio-grid">
                            ${artist.portfolio ? artist.portfolio.slice(0, 6).map(work => `
                                <img src="${work}" alt="Artwork by ${artist.name}" loading="lazy">
                            `).join('') : '<p>No portfolio images available</p>'}
                        </div>
                    </div>
                    <div class="artist-contact">
                        ${artist.website ? `<a href="${artist.website}" target="_blank" class="btn btn-primary">View Portfolio</a>` : ''}
                        ${artist.email ? `<a href="mailto:${artist.email}" class="btn btn-secondary">Contact Artist</a>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return modal;
}

function saveRecentlyViewed(artist) {
    const recentlyViewed = getUserPreference('recentlyViewedArtists', []);
    
    // Remove if already exists
    const filtered = recentlyViewed.filter(item => item.id !== artist.id);
    
    // Add to beginning
    filtered.unshift({
        id: artist.id,
        name: artist.name,
        medium: artist.medium,
        photo: artist.photo,
        viewedAt: new Date().toISOString()
    });
    
    // Keep only last 10
    const trimmed = filtered.slice(0, 10);
    
    saveUserPreference('recentlyViewedArtists', trimmed);
}

// ===== FILTER INTERFACE FUNCTIONS =====
function initializeArtistFilters() {
    const filterContainer = document.getElementById('artist-filters');
    if (!filterContainer) return;
    
    // Create filter HTML
    filterContainer.innerHTML = createFilterHTML();
    
    // Add event listeners
    setupFilterListeners();
    
    // Restore saved filters
    restoreFilters();
}

function createFilterHTML() {
    return `
        <div class="filter-section">
            <div class="filter-group">
                <label for="search-artists">Search Artists:</label>
                <input type="text" id="search-artists" placeholder="Search by name or description...">
            </div>
            
            <div class="filter-group">
                <label for="medium-filter">Art Medium:</label>
                <select id="medium-filter">
                    ${artistCategories.map(cat => `
                        <option value="${cat.value}">
                            ${cat.label} ${cat.count > 0 ? `(${cat.count})` : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="availability-filter">Availability:</label>
                <select id="availability-filter">
                    <option value="all">All Artists</option>
                    <option value="available">Available for Commissions</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="experience-filter">Experience Level:</label>
                <select id="experience-filter">
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="experienced">Experienced</option>
                    <option value="professional">Professional</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="sort-filter">Sort By:</label>
                <select id="sort-filter">
                    <option value="">Default</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="newest">Newest Members</option>
                    <option value="rating">Highest Rated</option>
                    <option value="portfolio">Most Works</option>
                </select>
            </div>
            
            <div class="filter-actions">
                <button type="button" id="apply-filters" class="btn btn-primary">Apply Filters</button>
                <button type="button" id="clear-filters" class="btn btn-outline">Clear All</button>
            </div>
        </div>
        
        <div class="results-info">
            <span id="results-count">Loading artists...</span>
            <div class="view-toggle">
                <button id="grid-view" class="view-btn active" aria-label="Grid view">⊞</button>
                <button id="list-view" class="view-btn" aria-label="List view">☰</button>
            </div>
        </div>
    `;
}

function setupFilterListeners() {
    const searchInput = document.getElementById('search-artists');
    const mediumFilter = document.getElementById('medium-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const sortFilter = document.getElementById('sort-filter');
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    
    // Search input with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyCurrentFilters();
            trackUserInteraction('artist_search', searchInput, { query: e.target.value });
        }, 300);
    });
    
    // Filter change handlers  
    [mediumFilter, availabilityFilter, experienceFilter, sortFilter].forEach(filter => {
        filter?.addEventListener('change', applyCurrentFilters);
    });
    
    // Button handlers
    applyBtn?.addEventListener('click', applyCurrentFilters);
    clearBtn?.addEventListener('click', clearAllFilters);
    gridViewBtn?.addEventListener('click', () => toggleView('grid'));
    listViewBtn?.addEventListener('click', () => toggleView('list'));
}

function applyCurrentFilters() {
    const filters = getCurrentFilters();
    const container = document.getElementById('artists-container');
    
    if (container) {
        displayAllArtists(container, filters);
        
        // Track filter usage
        trackUserInteraction('filters_applied', 'form', filters);
        
        // Save current filters
        saveUserPreference('currentArtistFilters', filters);
    }
}

function getCurrentFilters() {
    return {
        search: document.getElementById('search-artists')?.value || '',
        medium: document.getElementById('medium-filter')?.value || 'all',
        availability: document.getElementById('availability-filter')?.value || 'all',
        experience: document.getElementById('experience-filter')?.value || '',
        sortBy: document.getElementById('sort-filter')?.value || ''
    };
}

function clearAllFilters() {
    // Reset all filter inputs
    const searchInput = document.getElementById('search-artists');
    const mediumFilter = document.getElementById('medium-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput) searchInput.value = '';
    if (mediumFilter) mediumFilter.value = 'all';
    if (availabilityFilter) availabilityFilter.value = 'all';
    if (experienceFilter) experienceFilter.value = '';
    if (sortFilter) sortFilter.value = '';
    
    // Apply cleared filters
    applyCurrentFilters();
    
    // Clear saved filters
    saveUserPreference('currentArtistFilters', {});
    
    trackUserInteraction('filters_cleared', 'button');
}

function restoreFilters() {
    const savedFilters = getUserPreference('currentArtistFilters', {});
    
    if (Object.keys(savedFilters).length === 0) return;
    
    // Restore filter values
    const searchInput = document.getElementById('search-artists');
    const mediumFilter = document.getElementById('medium-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const experienceFilter = document.getElementById('experience-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (searchInput && savedFilters.search) searchInput.value = savedFilters.search;
    if (mediumFilter && savedFilters.medium) mediumFilter.value = savedFilters.medium;
    if (availabilityFilter && savedFilters.availability) availabilityFilter.value = savedFilters.availability;
    if (experienceFilter && savedFilters.experience) experienceFilter.value = savedFilters.experience;
    if (sortFilter && savedFilters.sortBy) sortFilter.value = savedFilters.sortBy;
    
    // Apply restored filters
    setTimeout(applyCurrentFilters, 100);
}

function toggleView(viewType) {
    const container = document.getElementById('artists-container');
    const gridBtn = document.getElementById('grid-view');
    const listBtn = document.getElementById('list-view');
    
    if (!container) return;
    
    // Update button states
    if (viewType === 'grid') {
        gridBtn?.classList.add('active');
        listBtn?.classList.remove('active');
        container.classList.remove('list-view');
        container.classList.add('grid-view');
    } else {
        listBtn?.classList.add('active');
        gridBtn?.classList.remove('active');
        container.classList.remove('grid-view');
        container.classList.add('list-view');
    }
    
    // Save preference
    saveUserPreference('artistViewType', viewType);
    
    // Track interaction
    trackUserInteraction('view_toggle', 'button', { viewType });
}

// ===== EXPORT FUNCTIONS =====
export {
    loadArtists,
    displayFeaturedArtists,
    displayAllArtists,
    filterArtists,
    initializeArtistFilters,
    artistCategories
};

// ===== AUTO-INITIALIZE FOR ARTISTS PAGE =====
if (window.location.pathname.includes('artists.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await loadArtists();
            initializeArtistFilters();
            
            const container = document.getElementById('artists-container');
            if (container) {
                displayAllArtists(container);
            }
        } catch (error) {
            console.error('Error initializing artists page:', error);
        }
    });
}