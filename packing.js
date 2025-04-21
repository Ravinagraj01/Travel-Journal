// DOM Elements
const packingModal = document.getElementById('packingModal');
const createListBtn = document.getElementById('createListBtn');
const packingForm = document.getElementById('packingForm');
const packingLists = document.getElementById('packingLists');
const searchList = document.getElementById('searchList');
const filterByType = document.getElementById('filterByType');
const totalLists = document.getElementById('totalLists');
const completedItems = document.getElementById('completedItems');

// Predefined packing items based on trip type
const packingItems = {
    beach: [
        'Swimsuit',
        'Sunscreen',
        'Beach towel',
        'Sunglasses',
        'Flip flops',
        'Beach bag',
        'Hat',
        'Water bottle',
        'Beach cover-up',
        'Snorkel gear'
    ],
    city: [
        'Comfortable walking shoes',
        'City map or guidebook',
        'Umbrella',
        'Camera',
        'Day bag',
        'Water bottle',
        'Sunglasses',
        'Light jacket',
        'Charging cables',
        'Travel adapter'
    ],
    hiking: [
        'Hiking boots',
        'Backpack',
        'Water bottle',
        'First aid kit',
        'Hiking poles',
        'Rain jacket',
        'Compass',
        'Energy bars',
        'Headlamp',
        'Multi-tool'
    ],
    business: [
        'Business attire',
        'Laptop',
        'Notebook',
        'Pens',
        'Business cards',
        'Charging cables',
        'Travel adapter',
        'Portfolio',
        'Watch',
        'Briefcase'
    ]
};

// Load packing lists when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPackingLists();
    updateStatistics();
});

// Event Listeners
createListBtn.addEventListener('click', () => openModal());
searchList.addEventListener('input', filterLists);
filterByType.addEventListener('change', filterLists);

// Add close button event listener
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// Modal Functions
function openModal(list = null) {
    packingModal.style.display = 'block';
    if (list) {
        document.getElementById('modalTitle').textContent = 'Edit Packing List';
        populateForm(list);
        packingForm.dataset.editId = list.id;
    } else {
        document.getElementById('modalTitle').textContent = 'Create New Packing List';
        packingForm.reset();
        delete packingForm.dataset.editId;
    }
}

function closeModal() {
    packingModal.style.display = 'none';
    packingForm.reset();
    delete packingForm.dataset.editId;
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === packingModal) {
        closeModal();
    }
});

// Form Submission
packingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const list = {
        name: document.getElementById('listName').value,
        type: document.getElementById('tripType').value,
        duration: parseInt(document.getElementById('tripDuration').value),
        season: document.getElementById('season').value,
        notes: document.getElementById('additionalNotes').value,
        items: generatePackingItems(
            document.getElementById('tripType').value,
            parseInt(document.getElementById('tripDuration').value)
        )
    };

    if (packingForm.dataset.editId) {
        list.id = parseInt(packingForm.dataset.editId);
        updatePackingList(list);
    } else {
        addPackingList(list);
    }

    closeModal();
});

// Packing List Management
function addPackingList(list) {
    list.id = Date.now();
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    lists.push(list);
    localStorage.setItem('packingLists', JSON.stringify(lists));
    displayPackingList(list);
    updateStatistics();
}

function updatePackingList(list) {
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    const index = lists.findIndex(l => l.id === list.id);
    if (index !== -1) {
        lists[index] = list;
        localStorage.setItem('packingLists', JSON.stringify(lists));
        loadPackingLists();
        updateStatistics();
    }
}

function deletePackingList(id) {
    if (confirm('Are you sure you want to delete this packing list?')) {
        const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
        const filteredLists = lists.filter(l => l.id !== id);
        localStorage.setItem('packingLists', JSON.stringify(filteredLists));
        loadPackingLists();
        updateStatistics();
    }
}

// Display Functions
function loadPackingLists() {
    packingLists.innerHTML = '';
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    lists.forEach(list => displayPackingList(list));
}

function displayPackingList(list) {
    const listElement = document.createElement('div');
    listElement.className = 'packing-list';
    listElement.dataset.id = list.id;
    
    const completedCount = list.items.filter(item => item.completed).length;
    const totalItems = list.items.length;
    
    listElement.innerHTML = `
        <div class="list-header">
            <h3>${list.name}</h3>
            <span class="list-type">${list.type}</span>
            <span class="list-duration">${list.duration} days</span>
            <span class="list-season">${list.season}</span>
            <div class="progress-bar">
                <div class="progress" style="width: ${(completedCount / totalItems) * 100}%"></div>
                <span>${completedCount}/${totalItems} items</span>
            </div>
        </div>
        ${list.notes ? `<p class="list-notes">${list.notes}</p>` : ''}
        <ul class="packing-items">
            ${list.items.map(item => `
                <li class="packing-item ${item.completed ? 'completed' : ''}">
                    <input type="checkbox" 
                           ${item.completed ? 'checked' : ''}
                           onchange="toggleItem(${list.id}, '${item.name}')">
                    <span>${item.name}</span>
                </li>
            `).join('')}
        </ul>
        <div class="list-actions">
            <button onclick="editPackingList(${list.id})">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deletePackingList(${list.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    packingLists.appendChild(listElement);
}

// Filter Functions
function filterLists() {
    const searchTerm = searchList.value.toLowerCase();
    const typeFilter = filterByType.value;
    const lists = document.querySelectorAll('.packing-list');
    
    lists.forEach(list => {
        const name = list.querySelector('h3').textContent.toLowerCase();
        const type = list.querySelector('.list-type').textContent.toLowerCase();
        
        let show = true;
        
        if (searchTerm && !name.includes(searchTerm)) {
            show = false;
        }
        
        if (typeFilter !== 'all' && type !== typeFilter) {
            show = false;
        }
        
        list.style.display = show ? 'block' : 'none';
    });
}

// Statistics
function updateStatistics() {
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    let totalCompleted = 0;
    let totalItems = 0;
    
    lists.forEach(list => {
        list.items.forEach(item => {
            if (item.completed) totalCompleted++;
            totalItems++;
        });
    });
    
    totalLists.textContent = lists.length;
    completedItems.textContent = totalCompleted;
}

// Helper Functions
function generatePackingItems(type, duration) {
    const baseItems = packingItems[type] || [];
    const additionalItems = [];
    
    // Add items based on duration
    if (duration > 3) {
        additionalItems.push('Laundry detergent');
        additionalItems.push('Extra clothes');
    }
    
    if (duration > 7) {
        additionalItems.push('Travel iron');
        additionalItems.push('Extra shoes');
    }
    
    return [...baseItems, ...additionalItems].map(item => ({
        name: item,
        completed: false
    }));
}

// Make functions available globally
window.toggleItem = function(listId, itemName) {
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    const list = lists.find(l => l.id === listId);
    
    if (list) {
        const item = list.items.find(i => i.name === itemName);
        if (item) {
            item.completed = !item.completed;
            localStorage.setItem('packingLists', JSON.stringify(lists));
            loadPackingLists();
            updateStatistics();
        }
    }
};

window.editPackingList = function(id) {
    const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
    const list = lists.find(l => l.id === id);
    if (list) {
        openModal(list);
    }
};

window.deletePackingList = function(id) {
    if (confirm('Are you sure you want to delete this packing list?')) {
        const lists = JSON.parse(localStorage.getItem('packingLists') || '[]');
        const filteredLists = lists.filter(l => l.id !== id);
        localStorage.setItem('packingLists', JSON.stringify(filteredLists));
        loadPackingLists();
        updateStatistics();
    }
};

function populateForm(list) {
    document.getElementById('listName').value = list.name;
    document.getElementById('tripType').value = list.type;
    document.getElementById('tripDuration').value = list.duration;
    document.getElementById('season').value = list.season;
    document.getElementById('additionalNotes').value = list.notes || '';
} 