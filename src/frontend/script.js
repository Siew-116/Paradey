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

    const analyzeBtn = document.getElementById('applyBtn');

const cardData = [
  {
    rank: "1",
    location: "Mount Trusmadi",
    fullLoc: "Keningau, Sabah, Malaysia",
    score: "85%",
    suggestion: "Great for challenging hikes with less crowd"
  },
  {
    rank: "2",
    location: "Crocker Range",
    fullLoc: "Tambunan, Sabah, Malaysia",
    score: "78%",
    suggestion: "Scenic trails and rich biodiversity for nature lovers"
  },
  {
    rank: "3",
    location: "Bukit Batur",
    fullLoc: "Kintamani, Bali, Indonesia",
    score: "72%",
    suggestion: "Easier climb with sunrise views, perfect for beginners"
  }
];

analyzeBtn.addEventListener('click', () => {
  const cards = document.querySelectorAll('.top3-card');
  cards.forEach((card, index) => {
    const data = cardData[index];
    card.querySelector('.rank').textContent = data.rank;
    card.querySelector('.location-name').textContent = data.location;
    card.querySelector('.full-loc').textContent = data.fullLoc;
    card.querySelector('.score').textContent = data.score;
    card.querySelector('.suggestion').textContent = data.suggestion;

    // Activate style
    card.classList.remove('inactive');
    // Activate glow for top 1
    if (index === 0) {
      card.classList.add('active');
    }
  });

});

});