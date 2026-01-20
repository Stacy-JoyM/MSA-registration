// Navbar JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const navToggleBtn = document.getElementById('nav-toggle-btn');
    const navList = document.getElementById('nav-list');
    const mobileFocusBg = document.getElementById('mobile-focus-bg');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (navToggleBtn) {
        navToggleBtn.addEventListener('click', function() {
            const isExpanded = navToggleBtn.getAttribute('aria-expanded') === 'true';
            
            navToggleBtn.setAttribute('aria-expanded', !isExpanded);
            navList.classList.toggle('active');
            mobileFocusBg.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (!isExpanded) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close mobile menu when clicking background
    if (mobileFocusBg) {
        mobileFocusBg.addEventListener('click', function() {
            navToggleBtn.setAttribute('aria-expanded', 'false');
            navList.classList.remove('active');
            mobileFocusBg.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navToggleBtn.setAttribute('aria-expanded', 'false');
                navList.classList.remove('active');
                mobileFocusBg.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Highlight active page
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Remove active class first
        link.classList.remove('active');
        
        // Check if current path matches link path exactly
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
        // Special case: if on root (/) and link is /events, make it active (since root redirects to /events)
        if (currentPath === '/' && linkPath === '/events') {
            link.classList.add('active');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navList.classList.remove('active');
            mobileFocusBg.classList.remove('active');
            navToggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });
});
