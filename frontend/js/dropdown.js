// Handle dropdown toggle
function toggleDropdown() {
    const dropdownMenu = document.getElementById('dropdownMenu');
    dropdownMenu.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!profileDropdown.contains(event.target)) {
        dropdownMenu.classList.add('hidden');
    }
});
