// Dark Mode Functionality
(function() {
    // Apply dark mode immediately to prevent flash of light theme
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Apply dark mode if explicitly enabled or if user prefers dark mode and has no saved preference
    if (darkModeEnabled || (localStorage.getItem('darkMode') === null && prefersDarkMode)) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
    }

    // Initialize dark mode toggle when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (!darkModeToggle) return;
        
        // Set initial state of toggle
        darkModeToggle.checked = darkModeEnabled || (localStorage.getItem('darkMode') === null && prefersDarkMode);
        
        // Update label based on current state
        updateDarkModeLabel(darkModeToggle);
        
        // Add event listener for toggle changes
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this);
        });
        
        // Also listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (localStorage.getItem('darkMode') === null) {
                // Only auto-switch if user hasn't set a preference
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                if (darkModeToggle) {
                    darkModeToggle.checked = e.matches;
                    updateDarkModeLabel(darkModeToggle);
                }
            }
        });
    });

    // Toggle dark mode
    function toggleDarkMode(toggle) {
        if (toggle.checked) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('darkMode', 'false');
        }
        
        // Update label
        updateDarkModeLabel(toggle);
    }

    // Update dark mode label
    function updateDarkModeLabel(toggle) {
        const label = toggle.nextElementSibling;
        if (!label) return;
        
        if (toggle.checked) {
            label.innerHTML = '<i class="bi bi-sun"></i> Light Mode';
        } else {
            label.innerHTML = '<i class="bi bi-moon-stars"></i> Dark Mode';
        }
    }
})();
