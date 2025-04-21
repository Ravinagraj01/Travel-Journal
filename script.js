// Initialize IndexedDB
let db;
const request = indexedDB.open('TravelJournalDB', 1);

request.onerror = (event) => {
    console.error('Database error:', event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains('entries')) {
        const objectStore = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('date', 'date', { unique: false });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    console.log('Database opened successfully');
    loadEntries();
};

// DOM Elements
const modal = document.getElementById('entryModal');
const addEntryBtn = document.getElementById('addEntryBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const entryForm = document.getElementById('entryForm');
const entriesContainer = document.getElementById('entriesContainer');
const modalTitle = document.getElementById('modalTitle');

// Rich Text Editor Toolbar
const toolbarButtons = document.querySelectorAll('.toolbar-btn');
toolbarButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const command = button.dataset.command;
        document.execCommand(command, false, null);
    });
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = body.getAttribute('data-theme') === 'dark';
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Statistics Tracking
let uniqueCountries = new Set();
let uniqueCities = new Set();

function updateStatistics() {
    if (!db) {
        console.log('Database not initialized yet');
        return;
    }

    try {
        const transaction = db.transaction(['entries'], 'readonly');
        const objectStore = transaction.objectStore('entries');
        const request = objectStore.getAll();

        request.onsuccess = () => {
            const entries = request.result;
            document.getElementById('entriesCount').textContent = entries.length;
            
            // Update unique locations
            const countries = new Set();
            const cities = new Set();
            
            entries.forEach(entry => {
                if (entry.country) countries.add(entry.country);
                if (entry.city) cities.add(entry.city);
            });
            
            document.getElementById('countriesCount').textContent = countries.size;
            document.getElementById('citiesCount').textContent = cities.size;
        };

        request.onerror = (event) => {
            console.error('Error updating statistics:', event.target.error);
        };
    } catch (error) {
        console.error('Error in updateStatistics:', error);
    }
}

// Weather Integration
async function getWeatherData(location) {
    const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`);
        const data = await response.json();
        return {
            temperature: data.main.temp,
            description: data.weather[0].description,
            icon: data.weather[0].icon
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

// Modify the createEntryElement function to remove weather
function createEntryElement(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'entry';
    
    entryElement.innerHTML = `
        <div class="entry-header">
            <h3>${entry.title}</h3>
            <span class="entry-date">${entry.date}</span>
        </div>
        <div class="entry-location">
            <i class="fas fa-map-marker-alt"></i>
            ${entry.city}, ${entry.country}
        </div>
        <div class="entry-image">
            <img src="${entry.image}" alt="${entry.title}">
        </div>
        <div class="entry-description">${entry.description}</div>
        <div class="entry-actions">
            <button class="edit-btn" onclick="editEntry(${entry.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="deleteEntry(${entry.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return entryElement;
}

// Remove weather styles
const style = document.createElement('style');
style.textContent = `
    .entry {
        background-color: var(--card-bg);
        border-radius: 10px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px var(--shadow-color);
        transition: transform 0.3s;
    }
    
    .entry:hover {
        transform: translateY(-5px);
    }
    
    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .entry-location {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        color: var(--text-color);
    }
    
    .entry-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    
    .entry-description {
        margin-bottom: 1rem;
    }
    
    .entry-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }
    
    .edit-btn, .delete-btn {
        background: none;
        border: none;
        color: var(--text-color);
        cursor: pointer;
        padding: 0.5rem;
        transition: color 0.3s;
    }
    
    .edit-btn:hover {
        color: var(--primary-color);
    }
    
    .delete-btn:hover {
        color: #ff4444;
    }
`;
document.head.appendChild(style);

// Modal Functions
function openModal(entry = null) {
    modal.style.display = 'block';
    if (entry) {
        modalTitle.textContent = 'Edit Travel Entry';
        populateForm(entry);
        entryForm.dataset.editId = entry.id;
    } else {
        modalTitle.textContent = 'Add New Travel Entry';
        entryForm.reset();
        document.getElementById('entryDescription').innerHTML = '';
        delete entryForm.dataset.editId;
    }
}

function closeModal() {
    modal.style.display = 'none';
    entryForm.reset();
    document.getElementById('entryDescription').innerHTML = '';
    delete entryForm.dataset.editId;
}

// Event Listeners
addEntryBtn.addEventListener('click', () => openModal());
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// Form Submission
entryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const imageInput = document.getElementById('entryImage');
        const imageFile = imageInput.files[0];
        
        if (!imageFile) {
            alert('Please select an image');
            return;
        }

        const entry = {
            date: document.getElementById('entryDate').value,
            title: document.getElementById('entryTitle').value,
            country: document.getElementById('entryCountry').value,
            city: document.getElementById('entryCity').value,
            description: document.getElementById('entryDescription').innerHTML,
            image: await getImageAsBase64(imageFile)
        };

        if (entryForm.dataset.editId) {
            entry.id = parseInt(entryForm.dataset.editId);
            updateEntry(entry);
        } else {
            addEntry(entry);
        }

        closeModal();
    } catch (error) {
        console.error('Error saving entry:', error);
        alert('There was an error saving your entry. Please try again.');
    }
});

// Database Operations
function addEntry(entry) {
    try {
        const transaction = db.transaction(['entries'], 'readwrite');
        const objectStore = transaction.objectStore('entries');
        const request = objectStore.add(entry);

        request.onsuccess = () => {
            console.log('Entry added successfully');
            loadEntries();
        };

        request.onerror = (event) => {
            console.error('Error adding entry:', event.target.error);
            alert('Failed to save entry. Please try again.');
        };
    } catch (error) {
        console.error('Error in addEntry:', error);
        alert('Failed to save entry. Please try again.');
    }
}

function updateEntry(entry) {
    try {
        const transaction = db.transaction(['entries'], 'readwrite');
        const objectStore = transaction.objectStore('entries');
        const request = objectStore.put(entry);

        request.onsuccess = () => {
            console.log('Entry updated successfully');
            loadEntries();
        };

        request.onerror = (event) => {
            console.error('Error updating entry:', event.target.error);
            alert('Failed to update entry. Please try again.');
        };
    } catch (error) {
        console.error('Error in updateEntry:', error);
        alert('Failed to update entry. Please try again.');
    }
}

function deleteEntry(id) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const transaction = db.transaction(['entries'], 'readwrite');
        const objectStore = transaction.objectStore('entries');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            loadEntries();
        };
    }
}

// Load and Display Entries
function loadEntries() {
    if (!db) {
        console.log('Database not initialized yet');
        return;
    }

    try {
        const transaction = db.transaction(['entries'], 'readonly');
        const objectStore = transaction.objectStore('entries');
        const index = objectStore.index('date');
        const request = index.openCursor(null, 'prev');

        const entriesContainer = document.getElementById('entriesContainer');
        if (!entriesContainer) {
            console.log('Entries container not found');
            return;
        }

        entriesContainer.innerHTML = '';

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                displayEntry(cursor.value);
                cursor.continue();
            } else {
                // After all entries are loaded, update statistics
                updateStatistics();
                // Initialize scroll animations
                handleScrollAnimation();
            }
        };

        request.onerror = (event) => {
            console.error('Error loading entries:', event.target.error);
        };
    } catch (error) {
        console.error('Error in loadEntries:', error);
    }
}

function displayEntry(entry) {
    const entryElement = document.createElement('div');
    entryElement.className = 'entry-card';
    entryElement.innerHTML = `
        <div class="entry-date">${formatDate(entry.date)}</div>
        <h2 class="entry-title">${entry.title}</h2>
        <div class="entry-location">
            <i class="fas fa-map-marker-alt"></i>
            ${entry.city}, ${entry.country}
        </div>
        <img src="${entry.image}" alt="${entry.title}" class="entry-image">
        <div class="entry-description">${entry.description}</div>
        <div class="entry-actions">
            <button class="edit-btn" onclick='editEntry(${JSON.stringify(entry)})'>
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" onclick="deleteEntry(${entry.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    entriesContainer.appendChild(entryElement);
}

function editEntry(entry) {
    openModal(entry);
}

// Helper Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function populateForm(entry) {
    document.getElementById('entryDate').value = entry.date;
    document.getElementById('entryTitle').value = entry.title;
    document.getElementById('entryCountry').value = entry.country;
    document.getElementById('entryCity').value = entry.city;
    document.getElementById('entryDescription').innerHTML = entry.description;
}

async function getImageAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Scroll Animation
function handleScrollAnimation() {
    const cards = document.querySelectorAll('.entry-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        observer.observe(card);
    });
}

// Travel Planning Section
const wishlistForm = document.getElementById('wishlistForm');
const wishlistItems = document.getElementById('wishlistItems');
const packingListForm = document.getElementById('packingListForm');
const packingList = document.getElementById('packingList');

// Wishlist functionality
if (wishlistForm) {
    wishlistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const destination = document.getElementById('destinationInput').value;
        const plannedDate = document.getElementById('plannedDate').value;
        const notes = document.getElementById('destinationNotes').value;
        
        const wishlistItem = {
            id: Date.now(),
            destination,
            plannedDate,
            notes,
            addedDate: new Date().toISOString()
        };
        
        addWishlistItem(wishlistItem);
        wishlistForm.reset();
    });
}

function addWishlistItem(item) {
    const wishlistItem = document.createElement('div');
    wishlistItem.className = 'wishlist-item';
    wishlistItem.dataset.id = item.id;
    
    wishlistItem.innerHTML = `
        <div class="wishlist-item-info">
            <h3>${item.destination}</h3>
            <p>Planned for: ${formatDate(item.plannedDate)}</p>
            ${item.notes ? `<p>${item.notes}</p>` : ''}
        </div>
        <div class="wishlist-item-actions">
            <button onclick="editWishlistItem(${item.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteWishlistItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    wishlistItems.appendChild(wishlistItem);
    saveWishlist();
}

function deleteWishlistItem(id) {
    const item = document.querySelector(`.wishlist-item[data-id="${id}"]`);
    if (item) {
        item.remove();
        saveWishlist();
    }
}

function saveWishlist() {
    const items = Array.from(wishlistItems.children).map(item => ({
        id: item.dataset.id,
        destination: item.querySelector('h3').textContent,
        plannedDate: item.querySelector('p').textContent.replace('Planned for: ', ''),
        notes: item.querySelector('p:last-child')?.textContent || ''
    }));
    
    localStorage.setItem('wishlist', JSON.stringify(items));
}

function loadWishlist() {
    const savedItems = JSON.parse(localStorage.getItem('wishlist') || '[]');
    savedItems.forEach(item => addWishlistItem(item));
}

// Packing List functionality
if (packingListForm) {
    packingListForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const tripName = document.getElementById('tripName').value;
        const duration = document.getElementById('tripDuration').value;
        const tripType = document.getElementById('tripType').value;
        
        generatePackingList(tripName, duration, tripType);
        packingListForm.reset();
    });
}

function generatePackingList(tripName, duration, tripType) {
    const baseItems = packingLists[tripType] || [];
    const durationBasedItems = generateDurationBasedItems(duration);
    const allItems = [...baseItems, ...durationBasedItems];
    
    packingList.innerHTML = `
        <h3>${tripName} Packing List</h3>
        <ul>
            ${allItems.map(item => `
                <li>
                    <input type="checkbox" id="${item.replace(/\s+/g, '-')}">
                    <label for="${item.replace(/\s+/g, '-')}">${item}</label>
                </li>
            `).join('')}
        </ul>
    `;
    
    // Add event listeners to checkboxes
    packingList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.classList.add('completed');
            } else {
                label.classList.remove('completed');
            }
        });
    });
}

function generateDurationBasedItems(duration) {
    const items = [];
    const days = parseInt(duration);
    
    if (days > 3) {
        items.push('Laundry detergent');
        items.push('Extra clothes');
    }
    
    if (days > 7) {
        items.push('Travel-sized toiletries');
        items.push('Extra shoes');
    }
    
    return items;
}

// Load wishlist when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only load wishlist if we're on the wishlist page
    if (document.getElementById('wishlistForm')) {
        loadWishlist();
    }
    
    // Create seasonal background
    createSeasonalBackground();
    
    // Add smooth transitions for theme changes
    document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
    
    // Add hover effects to navigation items
    const navItems = document.querySelectorAll('.main-nav a');
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
            item.style.transition = 'transform 0.3s ease';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });
});

// Seasonal Background Animation
function createSeasonalBackground() {
    console.log('Creating seasonal background...');
    const background = document.createElement('div');
    background.className = 'seasonal-background';
    
    // Debug: Check if background is being created
    console.log('Background element created:', background);
    
    // Try to insert at the very beginning of the body
    if (document.body.firstChild) {
        document.body.insertBefore(background, document.body.firstChild);
        console.log('Background inserted before first child');
    } else {
        document.body.appendChild(background);
        console.log('Background appended to body');
    }

    const currentMonth = new Date().getMonth();
    console.log('Current month:', currentMonth);
    
    let season = 'spring';
    let elementType = 'leaf';
    let count = 50;

    // Determine season based on current month
    if (currentMonth >= 2 && currentMonth <= 4) {
        season = 'spring';
        elementType = 'leaf';
        count = 50;
    } else if (currentMonth >= 5 && currentMonth <= 7) {
        season = 'summer';
        elementType = 'bubble';
        count = 40;
    } else if (currentMonth >= 8 && currentMonth <= 10) {
        season = 'autumn';
        elementType = 'leaf';
        count = 45;
    } else {
        season = 'winter';
        elementType = 'snowflake';
        count = 60;
    }

    console.log(`Current season: ${season}, Element type: ${elementType}`);

    // Set season attribute for color theming
    document.body.setAttribute('data-season', season);
    console.log('Season attribute set:', document.body.getAttribute('data-season'));

    // Create seasonal elements
    for (let i = 0; i < count; i++) {
        const element = document.createElement('div');
        element.className = elementType;
        
        // Random position and animation delay
        element.style.left = `${Math.random() * 100}%`;
        element.style.animationDelay = `${Math.random() * 5}s`;
        element.style.animationDuration = `${5 + Math.random() * 5}s`;
        
        // Random size for variety
        const size = 15 + Math.random() * 25;
        element.style.width = `${size}px`;
        element.style.height = `${size}px`;
        
        // Random opacity for depth
        element.style.opacity = 0.5 + Math.random() * 0.5;

        // For spring leaves, add random autumn colors
        if (season === 'spring' && elementType === 'leaf') {
            const colors = ['#ff4444', '#ff8844', '#ffbb44', '#ffdd44', '#ff4444'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            element.style.filter = `hue-rotate(${Math.random() * 30}deg) brightness(${0.8 + Math.random() * 0.4})`;
            element.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${randomColor}"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>')`;
            console.log('Created colored leaf with color:', randomColor);
        }
        
        background.appendChild(element);
    }
    console.log(`Created ${count} ${elementType} elements`);
    
    // Debug: Check if elements were added
    console.log('Background children count:', background.children.length);
} 