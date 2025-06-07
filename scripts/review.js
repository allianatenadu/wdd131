// Product array (same as in form.js)
const products = [
    { id: "fc-1888", name: "flux capacitor" },
    { id: "fc-2050", name: "power laces" },
    { id: "fs-1987", name: "time circuits" },
    { id: "ac-2000", name: "low voltage reactor" },
    { id: "jj-1969", name: "warp equalizer" },
    { id: "hw-2021", name: "quantum processor" },
    { id: "nm-2023", name: "neural interface" },
    { id: "pt-2024", name: "plasma thruster" }
];

// Function to update the review counter
function updateReviewCounter() {
    // Get current count from localStorage
    let reviewCount = localStorage.getItem('reviewCount');
    
    // If no count exists, initialize to 0
    if (reviewCount === null) {
        reviewCount = 0;
    } else {
        reviewCount = parseInt(reviewCount);
    }
    
    // Increment the count
    reviewCount++;
    
    // Save back to localStorage
    localStorage.setItem('reviewCount', reviewCount);
    
    // Display the count
    document.getElementById('reviewCount').textContent = reviewCount;
}

// Function to get URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        productId: params.get('productName'),
        rating: params.get('rating'),
        installDate: params.get('installDate'),
        features: params.getAll('features'),
        writtenReview: params.get('writtenReview'),
        userName: params.get('userName')
    };
}

// Function to display review details
function displayReviewDetails() {
    const params = getUrlParams();
    
    // Find product name from ID
    const product = products.find(p => p.id === params.productId);
    const productName = product ? product.name : 'Unknown Product';
    
    // Display product name
    document.getElementById('productReviewed').textContent = productName;
    
    // Display rating with stars
    const rating = params.rating || 'Not rated';
    const stars = '★'.repeat(parseInt(rating) || 0) + '☆'.repeat(5 - (parseInt(rating) || 0));
    document.getElementById('ratingGiven').textContent = `${stars} (${rating}/5)`;
    
    // Display current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('reviewDate').textContent = formattedDate;
}

// Function to update last modified date
function updateLastModified() {
    const lastModifiedSpan = document.getElementById('lastModified');
    const lastModified = new Date(document.lastModified);
    
    // Format date as MM/DD/YYYY HH:MM:SS
    const formattedDate = lastModified.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    lastModifiedSpan.textContent = formattedDate;
}

// Function to animate the counter
function animateCounter() {
    const counterElement = document.getElementById('reviewCount');
    const finalCount = parseInt(counterElement.textContent);
    let currentCount = 0;
    const duration = 1000; // 1 second
    const increment = finalCount / (duration / 16); // 60fps
    
    const animate = () => {
        currentCount += increment;
        if (currentCount < finalCount) {
            counterElement.textContent = Math.floor(currentCount);
            requestAnimationFrame(animate);
        } else {
            counterElement.textContent = finalCount;
        }
    };
    
    // Start animation after a short delay
    setTimeout(animate, 500);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    updateReviewCounter();
    displayReviewDetails();
    updateLastModified();
    animateCounter();
});