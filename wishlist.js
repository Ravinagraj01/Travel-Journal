// DOM Elements
const destinationModal = document.getElementById('destinationModal');
const addDestinationBtn = document.getElementById('addDestinationBtn');
const destinationForm = document.getElementById('destinationForm');
const wishlistItems = document.getElementById('wishlistItems');
const searchDestination = document.getElementById('searchDestination');
const filterByDate = document.getElementById('filterByDate');
const totalDestinations = document.getElementById('totalDestinations');
const upcomingTrips = document.getElementById('upcomingTrips');

// Load wishlist when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadWishlist();
    updateStatistics();
});

// Event Listeners
addDestinationBtn.addEventListener('click', () => openModal());
searchDestination.addEventListener('input', filterDestinations);
filterByDate.addEventListener('change', filterDestinations);

// Modal Functions
function openModal(destination = null) {
    destinationModal.style.display = 'block';
    if (destination) {
        document.getElementById('modalTitle').textContent = 'Edit Destination';
        populateForm(destination);
        destinationForm.dataset.editId = destination.id;
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Destination';
        destinationForm.reset();
        delete destinationForm.dataset.editId;
    }
}

function closeModal() {
    destinationModal.style.display = 'none';
    destinationForm.reset();
    delete destinationForm.dataset.editId;
}

// Form Submission
destinationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const destination = {
        name: document.getElementById('destinationName').value,
        country: document.getElementById('destinationCountry').value,
        plannedDate: document.getElementById('plannedDate').value,
        notes: document.getElementById('destinationNotes').value,
        priority: document.getElementById('priority').value,
        image: await getImageAsBase64(document.getElementById('destinationImage').files[0])
    };

    if (destinationForm.dataset.editId) {
        destination.id = destinationForm.dataset.editId;
        updateDestination(destination);
    } else {
        addDestination(destination);
    }

    closeModal();
});

// Destination Management
function addDestination(destination) {
    destination.id = Date.now();
    const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
    destinations.push(destination);
    localStorage.setItem('destinations', JSON.stringify(destinations));
    displayDestination(destination);
    updateStatistics();
}

function updateDestination(destination) {
    const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
    const index = destinations.findIndex(d => d.id === destination.id);
    if (index !== -1) {
        destinations[index] = destination;
        localStorage.setItem('destinations', JSON.stringify(destinations));
        loadWishlist();
        updateStatistics();
    }
}

function deleteDestination(id) {
    if (confirm('Are you sure you want to delete this destination?')) {
        const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
        const filteredDestinations = destinations.filter(d => d.id !== id);
        localStorage.setItem('destinations', JSON.stringify(filteredDestinations));
        loadWishlist();
        updateStatistics();
    }
}

// Display Functions
function loadWishlist() {
    wishlistItems.innerHTML = '';
    const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
    destinations.forEach(destination => displayDestination(destination));
}

function displayDestination(destination) {
    const destinationElement = document.createElement('div');
    destinationElement.className = 'wishlist-item';
    destinationElement.dataset.id = destination.id;
    
    destinationElement.innerHTML = `
        <div class="destination-image">
            ${destination.image ? `<img src="${destination.image}" alt="${destination.name}" class="destination-thumbnail">` : ''}
        </div>
        <div class="destination-content">
            <div class="priority priority-${destination.priority}">${destination.priority}</div>
            <h3>${destination.name}</h3>
            <p>${destination.country}</p>
            <p>Planned for: ${formatDate(destination.plannedDate)}</p>
            ${destination.notes ? `<p>${destination.notes}</p>` : ''}
            <div class="item-actions">
                <button onclick="editDestination(${destination.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteDestination(${destination.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    wishlistItems.appendChild(destinationElement);
}

// Filter Functions
function filterDestinations() {
    const searchTerm = searchDestination.value.toLowerCase();
    const dateFilter = filterByDate.value;
    const destinations = document.querySelectorAll('.wishlist-item');
    
    destinations.forEach(destination => {
        const name = destination.querySelector('h3').textContent.toLowerCase();
        const date = new Date(destination.querySelector('p:nth-of-type(2)').textContent.replace('Planned for: ', ''));
        const now = new Date();
        
        let show = true;
        
        if (searchTerm && !name.includes(searchTerm)) {
            show = false;
        }
        
        if (dateFilter === 'upcoming' && date < now) {
            show = false;
        } else if (dateFilter === 'past' && date >= now) {
            show = false;
        }
        
        destination.style.display = show ? 'block' : 'none';
    });
}

// Statistics
function updateStatistics() {
    const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
    const now = new Date();
    
    totalDestinations.textContent = destinations.length;
    upcomingTrips.textContent = destinations.filter(d => new Date(d.plannedDate) >= now).length;
}

// Helper Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function populateForm(destination) {
    document.getElementById('destinationName').value = destination.name;
    document.getElementById('destinationCountry').value = destination.country;
    document.getElementById('plannedDate').value = destination.plannedDate;
    document.getElementById('destinationNotes').value = destination.notes || '';
    document.getElementById('priority').value = destination.priority;
}

async function getImageAsBase64(file) {
    if (!file) return null;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Make functions available globally
window.editDestination = function(id) {
    const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
    const destination = destinations.find(d => d.id === id);
    if (destination) {
        openModal(destination);
    }
};

window.deleteDestination = function(id) {
    if (confirm('Are you sure you want to delete this destination?')) {
        const destinations = JSON.parse(localStorage.getItem('destinations') || '[]');
        const filteredDestinations = destinations.filter(d => d.id !== id);
        localStorage.setItem('destinations', JSON.stringify(filteredDestinations));
        loadWishlist();
        updateStatistics();
    }
}; 