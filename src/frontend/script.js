// Common use components for dashboard
document.addEventListener('DOMContentLoaded', () => {
    // === Dropdown menu for Export Btn ===
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');

    // Show when click
    exportBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent closing immediately
        exportDropdown.classList.toggle('show');
    });

    // Close dropdown if clicking outside
    document.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
    });
});