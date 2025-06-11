// temples.js - JavaScript for the Temple Album page

// Set footer year and last modified date
document.addEventListener('DOMContentLoaded', function() {
    // Set current year for copyright
    const currentYear = new Date().getFullYear();
    document.getElementById('current-year').textContent = currentYear;
    
    // Set last modified date
    const lastModified = document.lastModified;
    document.getElementById('last-modified').textContent = lastModified;
    
    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainNav = document.getElementById('main-nav');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    const closeIcon = document.querySelector('.close-icon');
    
    hamburgerMenu.addEventListener('click', function() {
        // Toggle the navigation visibility
        mainNav.classList.toggle('open');
        
        // Toggle the hamburger/close icons
        if (mainNav.classList.contains('open')) {
            hamburgerIcon.style.display = 'none';
            closeIcon.style.display = 'inline';
        } else {
            hamburgerIcon.style.display = 'inline';
            closeIcon.style.display = 'none';
        }
    });
    
    // Close the menu when a link is clicked
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Check if we're in mobile view (hamburger menu visible)
            if (window.getComputedStyle(hamburgerMenu).display !== 'none') {
                mainNav.classList.remove('open');
                hamburgerIcon.style.display = 'inline';
                closeIcon.style.display = 'none';
            }
        });
    });
    
    // Close the menu when window is resized to larger view
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            hamburgerIcon.style.display = 'inline';
            closeIcon.style.display = 'none';
        }
    });
});