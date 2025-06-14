// ===== EVENTS MODULE =====
// This module handles all event-related functionality

// ===== IMPORTS =====
import { saveUserPreference, getUserPreference, trackUserInteraction } from './main.js';

// ===== GLOBAL VARIABLES =====
let allEvents = [];
let filteredEvents = [];
let currentEventView = 'upcoming';

// Event categories for filtering
const eventCategories = [
    { value: 'all', label: 'All Events', count: 0 },
    { value: 'exhibition', label: 'Exhibitions', count: 0 },
    { value: 'workshop', label: 'Workshops', count: 0 },
    { value: 'gallery-opening', label: 'Gallery Openings', count: 0 },
    { value: 'art-fair', label: 'Art Fairs', count: 0 },
    { value: 'studio-tour', label: 'Studio Tours', count: 0 },
    { value: 'lecture', label: 'Lectures & Talks', count: 0 },
    { value: 'community', label: 'Community Events', count: 0 }
];

// ===== LOAD EVENTS DATA =====
async function loadEvents() {
    try {
        // Check for cached data first
        const cachedEvents = getUserPreference('cachedEvents', null);
        const cacheTimestamp = getUserPreference('eventsCacheTimestamp', 0);
        const now = Date.now();
        const cacheExpiry = 10 * 60 * 1000; // 10 minutes (events change more frequently)
        
        // Use cached data if still fresh
        if (cachedEvents && (now - cacheTimestamp) < cacheExpiry) {
            allEvents = cachedEvents;
            return allEvents;
        }
        
        // Fetch fresh data from JSON file
        const response = await fetch('data/events.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allEvents = data.events || data; // Handle different JSON structures
        
        // Cache the data
        saveUserPreference('cachedEvents', allEvents);
        saveUserPreference('eventsCacheTimestamp', now);
        
        // Process event data
        processEventData();
        
        return allEvents;
        
    } catch (error) {
        console.error('Error loading events:', error);
        
        // Show user-friendly error message
        showDataLoadError('events');
        
        // Return empty array to prevent crashes
        allEvents = [];
        return allEvents;
    }
}

// ===== ERROR HANDLING =====
function showDataLoadError(dataType) {
    const container = document.getElementById(`${dataType}-container`) || 
                    document.getElementById('events-container');
    
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

// ===== PROCESS EVENT DATA =====
function processEventData() {
    const now = new Date();
    
    // Add computed properties to each event
    allEvents = allEvents.map(event => {
        const eventDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : eventDate;
        
        return {
            ...event,
            id: event.id || generateEventId(event),
            formattedDate: formatEventDate(eventDate, endDate),
            isUpcoming: eventDate > now,
            isPast: endDate < now,
            isOngoing: eventDate <= now && endDate >= now,
            daysUntil: Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)),
            duration: calculateDuration(eventDate, endDate),
            isToday: isSameDay(eventDate, now),
            isThisWeek: isWithinWeek(eventDate, now),
            isThisMonth: isWithinMonth(eventDate, now)
        };
    });
    
    // Sort events by date
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Update category counts
    updateEventCategoryCounts();
}

// ===== DISPLAY UPCOMING EVENTS =====
function displayUpcomingEvents(events) {
    const container = document.getElementById('events-preview');
    
    if (!container) {
        // Container doesn't exist on this page, which is normal
        
        console.warn('No events preview container found. Skipping upcoming events display.');

        return;
    }
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="no-upcoming-events">
                <p>No upcoming events scheduled at the moment.</p>
                <a href="events.html" class="btn btn-outline">View All Events</a>
            </div>
        `;
        return;
    }
    
    // Template literal to build HTML
    const eventsHTML = events.map(event => createEventCardHTML(event, true)).join('');
    
    container.innerHTML = eventsHTML;
    
    // Add event listeners to event cards
    addEventCardListeners(container);
    
    // Track display
    trackUserInteraction('upcoming_events_displayed', 'section', {
        count: events.length,
        events: events.map(e => e.id)
    });
}

// ===== DISPLAY ALL EVENTS (for events.html page) =====
function displayAllEvents(container, filters = {}) {
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading exciting art events...</p>
        </div>
    `;
    
    // Apply filters
    filteredEvents = filterEvents(allEvents, filters);
    
    if (filteredEvents.length === 0) {
        container.innerHTML = createNoEventsHTML();
        return;
    }
    
    // Group events by status if needed
    const groupedEvents = groupEventsByStatus(filteredEvents);
    
    // Create events HTML
    const eventsHTML = createEventsListHTML(groupedEvents, filters.view || 'list');
    
    container.innerHTML = eventsHTML;
    
    // Add event listeners
    addEventCardListeners(container);
    
    // Update results count
    updateEventsResultsCount(filteredEvents.length, allEvents.length);
    
    // Save current filter
    saveUserPreference('lastEventFilter', filters);
}

// ===== FILTER EVENTS =====
function filterEvents(events, filters) {
    let filtered = [...events];
    
    // Filter by category/type
    if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(event => event.type === filters.category);
    }
    
    // Filter by time period
    if (filters.timeframe) {
        const now = new Date();
        
        switch (filters.timeframe) {
            case 'upcoming':
                filtered = filtered.filter(event => event.isUpcoming);
                break;
            case 'past':
                filtered = filtered.filter(event => event.isPast);
                break;
            case 'ongoing':
                filtered = filtered.filter(event => event.isOngoing);
                break;
            case 'today':
                filtered = filtered.filter(event => event.isToday);
                break;
            case 'this-week':
                filtered = filtered.filter(event => event.isThisWeek);
                break;
            case 'this-month':
                filtered = filtered.filter(event => event.isThisMonth);
                break;
        }
    }
    
    // Filter by location
    if (filters.location) {
        const locationTerm = filters.location.toLowerCase();
        filtered = filtered.filter(event => 
            event.location.toLowerCase().includes(locationTerm) ||
            event.venue?.toLowerCase().includes(locationTerm)
        );
    }
    
    // Search by title or description
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.organizer?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by price
    if (filters.priceRange) {
        switch (filters.priceRange) {
            case 'free':
                filtered = filtered.filter(event => event.price === 0 || event.isFree);
                break;
            case 'paid':
                filtered = filtered.filter(event => event.price > 0 && !event.isFree);
                break;
        }
    }
    
    // Sort results
    if (filters.sortBy) {
        filtered = sortEvents(filtered, filters.sortBy);
    }
    
    return filtered;
}

// ===== SORT EVENTS =====
function sortEvents(events, sortBy) {
    const sortedEvents = [...events];
    
    switch (sortBy) {
        case 'date-asc':
            return sortedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'date-desc':
            return sortedEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'title':
            return sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
        case 'location':
            return sortedEvents.sort((a, b) => a.location.localeCompare(b.location));
        case 'price':
            return sortedEvents.sort((a, b) => (a.price || 0) - (b.price || 0));
        default:
            return sortedEvents;
    }
}

// ===== CREATE EVENT CARD HTML =====
function createEventCardHTML(event, isPreview = false) {
    const statusClass = event.isUpcoming ? 'upcoming' : event.isOngoing ? 'ongoing' : 'past';
    const priceDisplay = event.isFree || event.price === 0 ? 'Free' : `${event.price}`;
    const dateDisplay = event.isToday ? 'Today' : event.formattedDate;
    
    // Template literal for event card
    return `
        <article class="event-card ${statusClass} ${isPreview ? 'preview' : ''}" 
                 data-event-id="${event.id}" 
                 data-category="${event.type}"
                 data-date="${event.date}"
                 tabindex="0"
                 role="button"
                 aria-label="View details for ${event.title}">
            ${event.image ? `
                <div class="event-image">
                    <img src="${event.image}" 
                         alt="${event.title}" 
                         loading="lazy"
                         onerror="this.src='images/placeholder-event.webp'">
                    <div class="event-status-badge ${statusClass}">
                        ${event.isUpcoming ? 'Upcoming' : event.isOngoing ? 'Happening Now' : 'Past Event'}
                    </div>
                </div>
            ` : ''}
            <div class="event-card-content">
                <div class="event-meta">
                    <span class="event-date" title="${event.formattedDate}">
                        📅 ${dateDisplay}
                    </span>
                    <span class="event-category">${formatEventCategory(event.type)}</span>
                </div>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-details">
                    <p class="event-location">📍 ${event.location}</p>
                    ${event.time ? `<p class="event-time">🕐 ${event.time}</p>` : ''}
                    <p class="event-price">💰 ${priceDisplay}</p>
                </div>
                <p class="event-description">${truncateDescription(event.description, isPreview ? 80 : 120)}</p>
                ${event.organizer ? `<p class="event-organizer">Organized by: ${event.organizer}</p>` : ''}
                <div class="event-actions">
                    ${event.registrationUrl ? `
                        <a href="${event.registrationUrl}" 
                           target="_blank" 
                           rel="noopener" 
                           class="btn btn-primary btn-small"
                           onclick="event.stopPropagation()">
                            ${event.isUpcoming ? 'Register' : 'Learn More'}
                        </a>
                    ` : ''}
                    ${event.isUpcoming ? `
                        <button class="btn btn-outline btn-small add-to-calendar" 
                                data-event-id="${event.id}"
                                onclick="event.stopPropagation()">
                            Add to Calendar
                        </button>
                    ` : ''}
                </div>
                ${event.daysUntil > 0 && event.daysUntil <= 7 ? `
                    <div class="event-countdown">
                        ${event.daysUntil === 1 ? 'Tomorrow!' : `In ${event.daysUntil} days`}
                    </div>
                ` : ''}
            </div>
        </article>
    `;
}

// ===== UTILITY FUNCTIONS =====
function generateEventId(event) {
    // Generate unique ID based on title and date
    const titleSlug = event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dateSlug = new Date(event.date).toISOString().split('T')[0];
    return `${titleSlug}-${dateSlug}`;
}

function formatEventDate(startDate, endDate = null) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    if (!endDate || isSameDay(startDate, endDate)) {
        return startDate.toLocaleDateString('en-US', options);
    }
    
    // Multi-day event
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    
    return `${startStr} - ${endStr}`;
}

function formatEventCategory(category) {
    const categoryMap = {
        'exhibition': 'Exhibition',
        'workshop': 'Workshop',
        'gallery-opening': 'Gallery Opening',
        'art-fair': 'Art Fair',
        'studio-tour': 'Studio Tour',
        'lecture': 'Lecture',
        'community': 'Community Event'
    };
    
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

function truncateDescription(description, maxLength) {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
}

function calculateDuration(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Single day';
    if (diffDays === 1) return '2 days';
    return `${diffDays + 1} days`;
}

function isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function isWithinWeek(eventDate, currentDate) {
    const diffTime = eventDate - currentDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
}

function isWithinMonth(eventDate, currentDate) {
    return eventDate.getMonth() === currentDate.getMonth() && 
           eventDate.getFullYear() === currentDate.getFullYear();
}

function updateEventCategoryCounts() {
    // Update category counts for filters
    eventCategories.forEach(category => {
        if (category.value === 'all') {
            category.count = allEvents.length;
        } else {
            category.count = allEvents.filter(event => event.type === category.value).length;
        }
    });
}

function updateEventsResultsCount(filteredCount, totalCount) {
    const countElement = document.getElementById('events-results-count');
    if (countElement) {
        countElement.textContent = `Showing ${filteredCount} of ${totalCount} events`;
    }
}

function groupEventsByStatus(events) {
    const grouped = {
        upcoming: events.filter(e => e.isUpcoming),
        ongoing: events.filter(e => e.isOngoing),
        past: events.filter(e => e.isPast)
    };
    
    return grouped;
}

function createEventsListHTML(groupedEvents, viewType = 'list') {
    const { upcoming, ongoing, past } = groupedEvents;
    
    let html = '';
    
    // Upcoming events
    if (upcoming.length > 0) {
        html += `
            <div class="events-section">
                <h3 class="events-section-title">Upcoming Events (${upcoming.length})</h3>
                <div class="events-grid ${viewType}-view">
                    ${upcoming.map(event => createEventCardHTML(event)).join('')}
                </div>
            </div>
        `;
    }
    
    // Ongoing events
    if (ongoing.length > 0) {
        html += `
            <div class="events-section">
                <h3 class="events-section-title">Happening Now (${ongoing.length})</h3>
                <div class="events-grid ${viewType}-view">
                    ${ongoing.map(event => createEventCardHTML(event)).join('')}
                </div>
            </div>
        `;
    }
    
    // Past events
    if (past.length > 0) {
        html += `
            <div class="events-section">
                <h3 class="events-section-title">Past Events (${past.length})</h3>
                <div class="events-grid ${viewType}-view">
                    ${past.map(event => createEventCardHTML(event)).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

function createNoEventsHTML() {
    return `
        <div class="no-events">
            <h3>No events found</h3>
            <p>Try adjusting your filters or check back later for new events.</p>
            <button onclick="clearEventFilters()" class="btn btn-outline">Clear Filters</button>
        </div>
    `;
}

// ===== EVENT HANDLERS =====
function addEventCardListeners(container) {
    const eventCards = container.querySelectorAll('.event-card');
    
    eventCards.forEach(card => {
        // Click handler
        card.addEventListener('click', handleEventCardClick);
        
        // Keyboard handler
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleEventCardClick.call(card, event);
            }
        });
        
        // Add to calendar buttons
        const calendarBtn = card.querySelector('.add-to-calendar');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                handleAddToCalendar(event.target.dataset.eventId);
            });
        }
    });
}

function handleEventCardClick(event) {
    // Prevent click if clicking on buttons or links
    if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') return;
    
    const eventId = this.dataset.eventId;
    const eventData = allEvents.find(e => e.id === eventId);
    
    if (eventData) {
        // Track interaction
        trackUserInteraction('event_card_click', this, {
            eventId,
            category: eventData.type,
            isUpcoming: eventData.isUpcoming
        });
        
        // Show event details modal
        showEventDetails(eventData);
        
        // Save to recently viewed
        saveRecentlyViewedEvent(eventData);
    }
}

function showEventDetails(eventData) {
    // Create and show event details modal
    const modal = createEventModal(eventData);
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

function createEventModal(eventData) {
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    
    const priceDisplay = eventData.isFree || eventData.price === 0 ? 'Free' : `${eventData.price}`;
    const statusClass = eventData.isUpcoming ? 'upcoming' : eventData.isOngoing ? 'ongoing' : 'past';
    
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content" tabindex="-1" role="dialog" aria-labelledby="event-modal-title">
            <button class="modal-close" aria-label="Close modal">&times;</button>
            <div class="modal-body">
                ${eventData.image ? `
                    <div class="event-detail-image">
                        <img src="${eventData.image}" alt="${eventData.title}">
                        <div class="event-status-badge ${statusClass}">
                            ${eventData.isUpcoming ? 'Upcoming' : eventData.isOngoing ? 'Happening Now' : 'Past Event'}
                        </div>
                    </div>
                ` : ''}
                <div class="event-detail-info">
                    <h2 id="event-modal-title">${eventData.title}</h2>
                    <div class="event-meta-detailed">
                        <p><strong>Date:</strong> ${eventData.formattedDate}</p>
                        ${eventData.time ? `<p><strong>Time:</strong> ${eventData.time}</p>` : ''}
                        <p><strong>Location:</strong> ${eventData.location}</p>
                        ${eventData.venue ? `<p><strong>Venue:</strong> ${eventData.venue}</p>` : ''}
                        <p><strong>Category:</strong> ${formatEventCategory(eventData.type)}</p>
                        <p><strong>Price:</strong> ${priceDisplay}</p>
                        ${eventData.organizer ? `<p><strong>Organizer:</strong> ${eventData.organizer}</p>` : ''}
                        ${eventData.duration ? `<p><strong>Duration:</strong> ${eventData.duration}</p>` : ''}
                    </div>
                    <div class="event-description-full">
                        <h3>About This Event</h3>
                        <p>${eventData.description}</p>
                        ${eventData.additionalInfo ? `<p>${eventData.additionalInfo}</p>` : ''}
                    </div>
                    ${eventData.requirements ? `
                        <div class="event-requirements">
                            <h3>Requirements</h3>
                            <p>${eventData.requirements}</p>
                        </div>
                    ` : ''}
                    <div class="event-actions-detailed">
                        ${eventData.registrationUrl ? `
                            <a href="${eventData.registrationUrl}" 
                               target="_blank" 
                               rel="noopener" 
                               class="btn btn-primary">
                                ${eventData.isUpcoming ? 'Register Now' : 'Learn More'}
                            </a>
                        ` : ''}
                        ${eventData.isUpcoming ? `
                            <button class="btn btn-secondary add-to-calendar-detailed" 
                                    data-event-id="${eventData.id}">
                                Add to Calendar
                            </button>
                        ` : ''}
                        <button class="btn btn-outline share-event" 
                                data-event-id="${eventData.id}">
                            Share Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for modal actions
    const addToCalendarBtn = modal.querySelector('.add-to-calendar-detailed');
    const shareBtn = modal.querySelector('.share-event');
    
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', () => {
            handleAddToCalendar(eventData.id);
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            handleShareEvent(eventData.id);
        });
    }
    
    return modal;
}

function handleAddToCalendar(eventId) {
    const eventData = allEvents.find(e => e.id === eventId);
    if (!eventData) return;
    
    // Create calendar event data
    const startDate = new Date(eventData.date);
    const endDate = eventData.endDate ? new Date(eventData.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
    
    const calendarData = {
        title: eventData.title,
        start: startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        end: endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
        description: eventData.description,
        location: eventData.location
    };
    
    // Generate Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarData.title)}&dates=${calendarData.start}/${calendarData.end}&details=${encodeURIComponent(calendarData.description)}&location=${encodeURIComponent(calendarData.location)}`;
    
    // Open in new window
    window.open(googleCalendarUrl, '_blank');
    
    // Track interaction
    trackUserInteraction('add_to_calendar', 'button', { eventId });
    
    // Save to user's calendar events
    const calendarEvents = getUserPreference('calendarEvents', []);
    calendarEvents.push({
        ...eventData,
        addedAt: new Date().toISOString()
    });
    
    // Keep only last 50 calendar events
    if (calendarEvents.length > 50) {
        calendarEvents.splice(0, calendarEvents.length - 50);
    }
    
    saveUserPreference('calendarEvents', calendarEvents);
}

function handleShareEvent(eventId) {
    const eventData = allEvents.find(e => e.id === eventId);
    if (!eventData) return;
    
    const shareData = {
        title: eventData.title,
        text: `Check out this event: ${eventData.title} - ${eventData.formattedDate} at ${eventData.location}`,
        url: window.location.href + `#event-${eventId}`
    };
    
    // Use Web Share API if available
    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
            .then(() => {
                alert('Event details copied to clipboard!');
            })
            .catch(() => {
                // Final fallback - show share modal
                showShareModal(shareData);
            });
    }
    
    // Track interaction
    trackUserInteraction('share_event', 'button', { eventId });
}

function showShareModal(shareData) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <h3>Share This Event</h3>
            <textarea readonly class="share-text">${shareData.text}\n${shareData.url}</textarea>
            <div class="share-actions">
                <button class="btn btn-primary copy-share-text">Copy to Clipboard</button>
                <button class="btn btn-outline close-share-modal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const copyBtn = modal.querySelector('.copy-share-text');
    const closeBtn = modal.querySelector('.close-share-modal');
    const textarea = modal.querySelector('.share-text');
    
    copyBtn.addEventListener('click', () => {
        textarea.select();
        document.execCommand('copy');
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            modal.remove();
        }, 1000);
    });
    
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
}

function saveRecentlyViewedEvent(eventData) {
    const recentlyViewed = getUserPreference('recentlyViewedEvents', []);
    
    // Remove if already exists
    const filtered = recentlyViewed.filter(item => item.id !== eventData.id);
    
    // Add to beginning
    filtered.unshift({
        id: eventData.id,
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        type: eventData.type,
        viewedAt: new Date().toISOString()
    });
    
    // Keep only last 10
    const trimmed = filtered.slice(0, 10);
    
    saveUserPreference('recentlyViewedEvents', trimmed);
}

// ===== FILTER INTERFACE FUNCTIONS =====
function initializeEventFilters() {
    const filterContainer = document.getElementById('event-filters');
    if (!filterContainer) return;
    
    // Create filter HTML
    filterContainer.innerHTML = createEventFilterHTML();
    
    // Add event listeners
    setupEventFilterListeners();
    
    // Restore saved filters
    restoreEventFilters();
}

function createEventFilterHTML() {
    return `
        <div class="filter-section">
            <div class="filter-group">
                <label for="search-events">Search Events:</label>
                <input type="text" id="search-events" placeholder="Search by title, description, or organizer...">
            </div>
            
            <div class="filter-group">
                <label for="category-filter">Event Type:</label>
                <select id="category-filter">
                    ${eventCategories.map(cat => `
                        <option value="${cat.value}">
                            ${cat.label} ${cat.count > 0 ? `(${cat.count})` : ''}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="timeframe-filter">Time Period:</label>
                <select id="timeframe-filter">
                    <option value="">All Time</option>
                    <option value="upcoming">Upcoming Events</option>
                    <option value="ongoing">Happening Now</option>
                    <option value="today">Today</option>
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="past">Past Events</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="location-filter">Location:</label>
                <input type="text" id="location-filter" placeholder="Filter by location or venue...">
            </div>
            
            <div class="filter-group">
                <label for="price-filter">Price Range:</label>
                <select id="price-filter">
                    <option value="">All Events</option>
                    <option value="free">Free Events</option>
                    <option value="paid">Paid Events</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label for="sort-events">Sort By:</label>
                <select id="sort-events">
                    <option value="date-asc">Date (Earliest First)</option>
                    <option value="date-desc">Date (Latest First)</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="location">Location (A-Z)</option>
                    <option value="price">Price (Low to High)</option>
                </select>
            </div>
            
            <div class="filter-actions">
                <button type="button" id="apply-event-filters" class="btn btn-primary">Apply Filters</button>
                <button type="button" id="clear-event-filters" class="btn btn-outline">Clear All</button>
            </div>
        </div>
        
        <div class="results-info">
            <span id="events-results-count">Loading events...</span>
            <div class="view-toggle">
                <button id="events-grid-view" class="view-btn active" aria-label="Grid view">⊞</button>
                <button id="events-list-view" class="view-btn" aria-label="List view">☰</button>
            </div>
        </div>
    `;
}

function setupEventFilterListeners() {
    const searchInput = document.getElementById('search-events');
    const categoryFilter = document.getElementById('category-filter');
    const timeframeFilter = document.getElementById('timeframe-filter');
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-events');
    const applyBtn = document.getElementById('apply-event-filters');
    const clearBtn = document.getElementById('clear-event-filters');
    const gridViewBtn = document.getElementById('events-grid-view');
    const listViewBtn = document.getElementById('events-list-view');
    
    // Search input with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyCurrentEventFilters();
            trackUserInteraction('event_search', searchInput, { query: e.target.value });
        }, 300);
    });
    
    // Filter change handlers
    [categoryFilter, timeframeFilter, locationFilter, priceFilter, sortFilter].forEach(filter => {
        filter?.addEventListener('change', applyCurrentEventFilters);
    });
    
    // Button handlers
    applyBtn?.addEventListener('click', applyCurrentEventFilters);
    clearBtn?.addEventListener('click', clearEventFilters);
    gridViewBtn?.addEventListener('click', () => toggleEventView('grid'));
    listViewBtn?.addEventListener('click', () => toggleEventView('list'));
}

function applyCurrentEventFilters() {
    const filters = getCurrentEventFilters();
    const container = document.getElementById('events-container');
    
    if (container) {
        displayAllEvents(container, filters);
        
        // Track filter usage
        trackUserInteraction('event_filters_applied', 'form', filters);
        
        // Save current filters
        saveUserPreference('currentEventFilters', filters);
    }
}

function getCurrentEventFilters() {
    return {
        search: document.getElementById('search-events')?.value || '',
        category: document.getElementById('category-filter')?.value || 'all',
        timeframe: document.getElementById('timeframe-filter')?.value || '',
        location: document.getElementById('location-filter')?.value || '',
        priceRange: document.getElementById('price-filter')?.value || '',
        sortBy: document.getElementById('sort-events')?.value || 'date-asc',
        view: getUserPreference('eventViewType', 'list')
    };
}

function clearEventFilters() {
    // Reset all filter inputs
    const searchInput = document.getElementById('search-events');
    const categoryFilter = document.getElementById('category-filter');
    const timeframeFilter = document.getElementById('timeframe-filter');
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-events');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = 'all';
    if (timeframeFilter) timeframeFilter.value = '';
    if (locationFilter) locationFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (sortFilter) sortFilter.value = 'date-asc';
    
    // Apply cleared filters
    applyCurrentEventFilters();
    
    // Clear saved filters
    saveUserPreference('currentEventFilters', {});
    
    trackUserInteraction('event_filters_cleared', 'button');
}

function restoreEventFilters() {
    const savedFilters = getUserPreference('currentEventFilters', {});
    
    if (Object.keys(savedFilters).length === 0) return;
    
    // Restore filter values
    const searchInput = document.getElementById('search-events');
    const categoryFilter = document.getElementById('category-filter');
    const timeframeFilter = document.getElementById('timeframe-filter');
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    const sortFilter = document.getElementById('sort-events');
    
    if (searchInput && savedFilters.search) searchInput.value = savedFilters.search;
    if (categoryFilter && savedFilters.category) categoryFilter.value = savedFilters.category;
    if (timeframeFilter && savedFilters.timeframe) timeframeFilter.value = savedFilters.timeframe;
    if (locationFilter && savedFilters.location) locationFilter.value = savedFilters.location;
    if (priceFilter && savedFilters.priceRange) priceFilter.value = savedFilters.priceRange;
    if (sortFilter && savedFilters.sortBy) sortFilter.value = savedFilters.sortBy;
    
    // Apply restored filters
    setTimeout(applyCurrentEventFilters, 100);
}

function toggleEventView(viewType) {
    const container = document.getElementById('events-container');
    const gridBtn = document.getElementById('events-grid-view');
    const listBtn = document.getElementById('events-list-view');
    
    if (!container) return;
    
    // Update button states
    if (viewType === 'grid') {
        gridBtn?.classList.add('active');
        listBtn?.classList.remove('active');
    } else {
        listBtn?.classList.add('active');
        gridBtn?.classList.remove('active');
    }
    
    // Save preference and reapply filters with new view
    saveUserPreference('eventViewType', viewType);
    applyCurrentEventFilters();
    
    // Track interaction
    trackUserInteraction('event_view_toggle', 'button', { viewType });
}

// ===== EXPORT FUNCTIONS =====
export {
    loadEvents,
    displayUpcomingEvents,
    displayAllEvents,
    filterEvents,
    initializeEventFilters,
    eventCategories
};

// ===== AUTO-INITIALIZE FOR EVENTS PAGE =====
if (window.location.pathname.includes('events.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            await loadEvents();
            initializeEventFilters();
            
            const container = document.getElementById('events-container');
            if (container) {
                displayAllEvents(container, { timeframe: 'upcoming' });
            }
        } catch (error) {
            console.error('Error initializing events page:', error);
        }
    });
}