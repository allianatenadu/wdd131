// Product array - normally this would come from an external source
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

// Function to populate the product dropdown
function populateProducts() {
    const productSelect = document.getElementById('productName');
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
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

// Function to handle form submission
function handleFormSubmit(event) {
    const form = event.target;
    
    // Check if at least one feature checkbox is selected
    const checkboxes = form.querySelectorAll('input[name="features"]:checked');
    
    // Visual feedback for rating selection
    const selectedRating = form.querySelector('input[name="rating"]:checked');
    if (selectedRating) {
        // Add visual feedback
        const allLabels = form.querySelectorAll('.rating-label');
        allLabels.forEach((label, index) => {
            const stars = label.querySelector('.stars');
            if (index < parseInt(selectedRating.value)) {
                stars.style.color = '#FFA500';
            }
        });
    }
}

// Function to add interactive rating preview
function setupRatingInteraction() {
    const ratingLabels = document.querySelectorAll('.rating-label');
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    
    ratingLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', () => {
            // Highlight stars up to the hovered rating
            ratingLabels.forEach((l, i) => {
                const stars = l.querySelector('.stars');
                if (i <= index) {
                    stars.style.color = '#FFA500';
                } else {
                    stars.style.color = '#212529';
                }
            });
        });
    });
    
    // Reset colors when mouse leaves the rating container
    const ratingContainer = document.querySelector('.rating-container');
    ratingContainer.addEventListener('mouseleave', () => {
        // Check if any rating is selected
        const selectedRating = document.querySelector('input[name="rating"]:checked');
        
        ratingLabels.forEach((label, index) => {
            const stars = label.querySelector('.stars');
            if (selectedRating && index < parseInt(selectedRating.value)) {
                stars.style.color = '#FFA500';
            } else {
                stars.style.color = '#212529';
            }
        });
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    populateProducts();
    updateLastModified();
    setupRatingInteraction();
    
    // Add form submit event listener
    const form = document.getElementById('reviewForm');
    form.addEventListener('submit', handleFormSubmit);
});