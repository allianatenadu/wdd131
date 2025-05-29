// Enhanced Temple Picture Album JavaScript

// Temple array with original temples plus 3 additional ones
const temples = [
  {
    templeName: "Aba Nigeria",
    location: "Aba, Nigeria",
    dedicated: "2005, August, 7",
    area: 11500,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/aba-nigeria/400x250/aba-nigeria-temple-lds-273999-wallpaper.jpg"
  },
  {
    templeName: "Manti Utah",
    location: "Manti, Utah, United States",
    dedicated: "1888, May, 21",
    area: 74792,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/manti-utah/400x250/manti-temple-768192-wallpaper.jpg"
  },
  {
    templeName: "Payson Utah",
    location: "Payson, Utah, United States",
    dedicated: "2015, June, 7",
    area: 96630,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/payson-utah/400x225/payson-utah-temple-exterior-1416671-wallpaper.jpg"
  },
  {
    templeName: "Yigo Guam",
    location: "Yigo, Guam",
    dedicated: "2020, May, 2",
    area: 6861,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/yigo-guam/400x250/yigo_guam_temple_2.jpg"
  },
  {
    templeName: "Washington D.C.",
    location: "Kensington, Maryland, United States",
    dedicated: "1974, November, 19",
    area: 156558,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/washington-dc/400x250/washington_dc_temple-exterior-2.jpeg"
  },
  {
    templeName: "Lima Perú",
    location: "Lima, Perú",
    dedicated: "1986, January, 10",
    area: 9600,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/lima-peru/400x250/lima-peru-temple-evening-1075606-wallpaper.jpg"
  },
  {
    templeName: "Mexico City Mexico",
    location: "Mexico City, Mexico",
    dedicated: "1983, December, 2",
    area: 116642,
    imageUrl:
    "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/mexico-city-mexico/400x250/mexico-city-temple-exterior-1518361-wallpaper.jpg"
  },
     {
        templeName: "Salt Lake",
        location: "Salt Lake City, Utah, United States",
        dedicated: "1893, April, 6",
        area: 253015,
        imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/salt-lake-city-utah/400x250/salt-lake-temple-37762.jpg"
    },
    {
        templeName: "Tokyo Japan",
        location: "Tokyo, Japan",
        dedicated: "1980, October, 27",
        area: 53997,
        imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/tokyo-japan/800x1280/tokyo_japan_temple-main.jpeg"
    },
    {
        templeName: "Rome Italy",
        location: "Rome, Italy",
        dedicated: "2019, March, 10",
        area: 41010,
        imageUrl: "https://content.churchofjesuschrist.org/templesldsorg/bc/Temples/photo-galleries/rome-italy/2019/800x500/1-Rome-Temple-2160936.jpg"
    }
];

// DOM elements - will be initialized when DOM is ready
let templeContainer, homeBtn, oldBtn, newBtn, largeBtn, smallBtn;

// Function to create temple cards
function createTempleCard(temple) {
    return `
        <div class="temple-card">
            <img src="${temple.imageUrl}" 
                 alt="${temple.templeName} Temple" 
                 loading="lazy">
            <div class="temple-info">
                <div class="temple-name">${temple.templeName}</div>
                <div class="temple-location">📍 ${temple.location}</div>
                <div class="temple-dedicated">
                    <strong>Dedicated:</strong> ${temple.dedicated}
                </div>
                <div class="temple-area">
                    <strong>Area:</strong> ${temple.area.toLocaleString()} sq ft
                </div>
            </div>
        </div>
    `;
}

// Function to display temples
function displayTemples(templesToShow) {
    if (templeContainer) {
        templeContainer.innerHTML = templesToShow.map(createTempleCard).join('');
    }
}

// Function to set active button
function setActiveButton(activeBtn) {
    // Remove active class from all navigation buttons
    const allButtons = document.querySelectorAll('.nav-button');
    if (allButtons) {
        allButtons.forEach(btn => btn.classList.remove('active'));
    }
    
    // Add active class to clicked button
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Filter functions
function showAllTemples() {
    displayTemples(temples);
    if (homeBtn) setActiveButton(homeBtn);
}

function showOldTemples() {
    const oldTemples = temples.filter(temple => {
        const year = parseInt(temple.dedicated.split(',')[0]);
        return year < 1900;
    });
    displayTemples(oldTemples);
    if (oldBtn) setActiveButton(oldBtn);
}

function showNewTemples() {
    const newTemples = temples.filter(temple => {
        const year = parseInt(temple.dedicated.split(',')[0]);
        return year > 2000;
    });
    displayTemples(newTemples);
    if (newBtn) setActiveButton(newBtn);
}

function showLargeTemples() {
    const largeTemples = temples.filter(temple => temple.area > 90000);
    displayTemples(largeTemples);
    if (largeBtn) setActiveButton(largeBtn);
}

function showSmallTemples() {
    const smallTemples = temples.filter(temple => temple.area < 10000);
    displayTemples(smallTemples);
    if (smallBtn) setActiveButton(smallBtn);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    templeContainer = document.getElementById('temple-container');
    homeBtn = document.getElementById('home');
    oldBtn = document.getElementById('old');
    newBtn = document.getElementById('new');
    largeBtn = document.getElementById('large');
    smallBtn = document.getElementById('small');
    
    // Set footer information
    try {
        const currentYear = new Date().getFullYear();
        const currentYearEl = document.getElementById('current-year');
        if (currentYearEl) {
            currentYearEl.textContent = currentYear;
        }
        
        const lastModified = document.lastModified;
        const lastModifiedEl = document.getElementById('last-modified');
        if (lastModifiedEl) {
            lastModifiedEl.textContent = lastModified;
        }
    } catch (error) {
        console.log('Footer elements not found:', error);
    }
    
    // Show all temples by default
    showAllTemples();
    
    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainNav = document.getElementById('main-nav');
    
    if (hamburgerMenu && mainNav) {
        hamburgerMenu.addEventListener('click', function() {
            mainNav.classList.toggle('open');
            hamburgerMenu.classList.toggle('active');
        });
    }
    
    // Function to close mobile menu
    function closeMenuIfMobile() {
        if (window.innerWidth < 768 && mainNav && hamburgerMenu) {
            mainNav.classList.remove('open');
            hamburgerMenu.classList.remove('active');
        }
    }
    
    // Event listeners for filter buttons
    if (homeBtn) {
        homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAllTemples();
            closeMenuIfMobile();
        });
    }
    
    if (oldBtn) {
        oldBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showOldTemples();
            closeMenuIfMobile();
        });
    }
    
    if (newBtn) {
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showNewTemples();
            closeMenuIfMobile();
        });
    }
    
    if (largeBtn) {
        largeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showLargeTemples();
            closeMenuIfMobile();
        });
    }
    
    if (smallBtn) {
        smallBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSmallTemples();
            closeMenuIfMobile();
        });
    }
    
    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && mainNav && hamburgerMenu) {
            mainNav.classList.remove('open');
            hamburgerMenu.classList.remove('active');
        }
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mainNav && mainNav.classList.contains('open')) {
            closeMenuIfMobile();
        }
    });
    
    console.log('Temple album initialized successfully!');
});