// Состояние приложения
const state = {
    currentPage: 'home',
    currentSection: null,
    sections: JSON.parse(localStorage.getItem('sections')) || [],
    homePosts: JSON.parse(localStorage.getItem('homePosts')) || [],
    editingCardId: null,
    deletingCardId: null
};

// DOM элементы
const elements = {
    kebabBtn: document.getElementById('kebab-btn'),
    kebabDropdown: document.getElementById('kebab-dropdown'),
    goHomeBtn: document.getElementById('go-home'),
    newSectionBtn: document.getElementById('new-section-btn'),
    newSectionForm: document.getElementById('new-section-form'),
    sectionNameInput: document.getElementById('section-name-input'),
    saveSectionBtn: document.getElementById('save-section-btn'),
    homePage: document.getElementById('home-page'),
    sectionPage: document.getElementById('section-page'),
    pageTitle: document.getElementById('page-title'),
    sectionsList: document.getElementById('sections-list'),
    homeContent: document.getElementById('home-content'),
    imageInput: document.getElementById('image-input'),
    textInput: document.getElementById('text-input'),
    addPostBtn: document.getElementById('add-post-btn'),
    sectionTitle: document.getElementById('section-title'),
    cardsContainer: document.getElementById('cards-container'),
    addCardBtn: document.getElementById('add-card-btn'),
    cardModal: document.getElementById('card-modal'),
    confirmModal: document.getElementById('confirm-modal'),
    cardLocation: document.getElementById('card-location'),
    cardImage: document.getElementById('card-image'),
    cardDescription: document.getElementById('card-description'),
    saveCardBtn: document.getElementById('save-card-btn'),
    cancelCardBtn: document.getElementById('cancel-card-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn')
};

// Инициализация
function init() {
    loadSections();
    renderHomePage();
    setupEventListeners();
}

// Загрузка разделов
function loadSections() {
    state.sections = JSON.parse(localStorage.getItem('sections')) || [];
}

// Сохранение разделов
function saveSections() {
    localStorage.setItem('sections', JSON.stringify(state.sections));
}

// Сохранение постов главной страницы
function saveHomePosts() {
    localStorage.setItem('homePosts', JSON.stringify(state.homePosts));
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кебаб-меню
    elements.kebabBtn.addEventListener('click', toggleKebabMenu);
    
    // Переход на главную
    elements.goHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showHomePage();
        closeKebabMenu();
    });
    
    // Новый раздел
    elements.newSectionBtn.addEventListener('click', showNewSectionForm);
    elements.saveSectionBtn.addEventListener('click', createNewSection);
    
    // Главная страница
    elements.addPostBtn.addEventListener('click', addHomePost);
    
    // Разделы
    elements.addCardBtn.addEventListener('click', showCardModal);
    
    // Модальное окно карточки
    elements.cancelCardBtn.addEventListener('click', closeCardModal);
    elements.saveCardBtn.addEventListener('click', saveCard);
    
    // Модальное окно подтверждения
    elements.cancelDeleteBtn.addEventListener('click', closeConfirmModal);
    elements.confirmDeleteBtn.addEventListener('click', confirmDeleteCard);
    
    // Клик вне меню
    document.addEventListener('click', (e) => {
        if (!elements.kebabBtn.contains(e.target) && 
            !elements.kebabDropdown.contains(e.target)) {
            closeKebabMenu();
        }
    });
}

// Управление кебаб-меню
function toggleKebabMenu() {
    elements.kebabDropdown.classList.toggle('show');
}

function closeKebabMenu() {
    elements.kebabDropdown.classList.remove('show');
}

// Управление разделами
function showNewSectionForm() {
    closeKebabMenu();
    elements.newSectionForm.classList.remove('hidden');
    elements.sectionNameInput.focus();
    elements.sectionNameInput.select();
}

function createNewSection() {
    const name = elements.sectionNameInput.value.trim() || 'Новый раздел';
    const newSection = {
        id: Date.now().toString(),
        name: name,
        cards: []
    };
    
    state.sections.push(newSection);
    saveSections();
    
    elements.newSectionForm.classList.add('hidden');
    showSection(newSection.id);
    renderSectionsList();
}

function renderSectionsList() {
    elements.sectionsList.innerHTML = '';
    
    state.sections.forEach(section => {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'menu-item section-item';
        sectionItem.innerHTML = `
            <span onclick="showSection('${section.id}')" style="cursor: pointer; flex-grow: 1;">
                📁 ${section.name}
            </span>
            <button class="delete-section-btn" onclick="deleteSection('${section.id}')">×</button>
        `;
        elements.sectionsList.appendChild(sectionItem);
    });
}

function deleteSection(sectionId) {
    if (confirm('Удалить раздел и все карточки в нем?')) {
        state.sections = state.sections.filter(s => s.id !== sectionId);
        saveSections();
        renderSectionsList();
        
        if (state.currentSection === sectionId) {
            showHomePage();
        }
    }
}

// Управление страницами
function showHomePage() {
    state.currentPage = 'home';
    state.currentSection = null;
    
    elements.homePage.classList.remove('hidden');
    elements.sectionPage.classList.add('hidden');
    elements.pageTitle.textContent = 'Главная страница';
    
    renderHomePage();
}

function showSection(sectionId) {
    state.currentPage = 'section';
    state.currentSection = sectionId;
    
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    elements.homePage.classList.add('hidden');
    elements.sectionPage.classList.remove('hidden');
    elements.pageTitle.textContent = section.name;
    elements.sectionTitle.textContent = section.name;
    
    renderSectionCards();
}

// Главная страница
function addHomePost() {
    const imageFile = elements.imageInput.files[0];
    const text = elements.textInput.value.trim();
    
    if (!imageFile && !text) {
        alert('Добавьте фото или текст');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newPost = {
            id: Date.now().toString(),
            image: imageFile ? e.target.result : null,
            text: text,
            date: new Date().toLocaleString('ru-RU')
        };
        
        state.homePosts.unshift(newPost);
        saveHomePosts();
        renderHomePage();
        
        // Сброс формы
        elements.imageInput.value = '';
        elements.textInput.value = '';
    };
    
    if (imageFile) {
        reader.readAsDataURL(imageFile);
    } else {
        const newPost = {
            id: Date.now().toString(),
            image: null,
            text: text,
            date: new Date().toLocaleString('ru-RU')
        };
        
        state.homePosts.unshift(newPost);
        saveHomePosts();
        renderHomePage();
        elements.textInput.value = '';
    }
}

function renderHomePage() {
    elements.homeContent.innerHTML = '';
    
    if (state.homePosts.length === 0) {
        elements.homeContent.innerHTML = '<p class="empty-state">Пока нет постов</p>';
        return;
    }
    
    state.homePosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        postElement.innerHTML = `
            ${post.image ? `<img src="${post.image}" alt="Post" class="post-image">` : ''}
            <div class="post-text">
                <p>${post.text}</p>
                <small>${post.date}</small>
            </div>
        `;
        elements.homeContent.appendChild(postElement);
    });
}

// Карточки в разделах
function showCardModal() {
    elements.editingCardId = null;
    elements.cardLocation.value = '';
    elements.cardImage.value = '';
    elements.cardDescription.value = '';
    document.getElementById('modal-title').textContent = 'Новая карточка';
    elements.cardModal.classList.remove('hidden');
}

function closeCardModal() {
    elements.cardModal.classList.add('hidden');
    elements.editingCardId = null;
}

function saveCard() {
    const location = elements.cardLocation.value.trim();
    const description = elements.cardDescription.value.trim();
    const imageFile = elements.cardImage.files[0];
    
    if (!location) {
        alert('Введите название локации');
        return;
    }
    
    const section = state.sections.find(s => s.id === state.currentSection);
    if (!section) return;
    
    if (elements.editingCardId) {
        // Редактирование существующей карточки
        const card = section.cards.find(c => c.id === elements.editingCardId);
        if (card) {
            card.location = location;
            card.description = description;
            if (imageFile) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    card.image = e.target.result;
                    saveSections();
                    renderSectionCards();
                    closeCardModal();
                };
                reader.readAsDataURL(imageFile);
            } else {
                saveSections();
                renderSectionCards();
                closeCardModal();
            }
        }
    } else {
        // Создание новой карточки
        const newCard = {
            id: Date.now().toString(),
            location: location,
            description: description,
            date: new Date().toLocaleString('ru-RU')
        };
        
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                newCard.image = e.target.result;
                section.cards.unshift(newCard);
                saveSections();
                renderSectionCards();
                closeCardModal();
            };
            reader.readAsDataURL(imageFile);
        } else {
            section.cards.unshift(newCard);
            saveSections();
            renderSectionCards();
            closeCardModal();
        }
    }
}

function editCard(cardId) {
    const section = state.sections.find(s => s.id === state.currentSection);
    if (!section) return;
    
    const card = section.cards.find(c => c.id === cardId);
    if (!card) return;
    
    elements.editingCardId = cardId;
    elements.cardLocation.value = card.location;
    elements.cardDescription.value = card.description || '';
    document.getElementById('modal-title').textContent = 'Редактировать карточку';
    elements.cardModal.classList.remove('hidden');
}

function deleteCard(cardId) {
    elements.deletingCardId = cardId;
    elements.confirmModal.classList.remove('hidden');
}

function closeConfirmModal() {
    elements.confirmModal.classList.add('hidden');
    elements.deletingCardId = null;
}

function confirmDeleteCard() {
    const cardId = elements.deletingCardId;
    if (!cardId) return;
    
    const section = state.sections.find(s => s.id === state.currentSection);
    if (!section) return;
    
    section.cards = section.cards.filter(c => c.id !== cardId);
    saveSections();
    renderSectionCards();
    closeConfirmModal();
}

function renderSectionCards() {
    elements.cardsContainer.innerHTML = '';
    
    const section = state.sections.find(s => s.id === state.currentSection);
    if (!section) return;
    
    // Сортировка по дате (новые выше)
    const sortedCards = [...section.cards].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    if (sortedCards.length === 0) {
        elements.cardsContainer.innerHTML = '<p class="empty-state">Пока нет карточек</p>';
        return;
    }
    
    sortedCards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${card.location}</h3>
                <span class="card-date">${card.date}</span>
            </div>
            ${card.image ? `<img src="${card.image}" alt="${card.location}" class="card-image">` : ''}
            <p class="card-description">${card.description}</p>
            <div class="card-actions">
                <button class="edit-btn" onclick="editCard('${card.id}')">✏️ Редактировать</button>
                <button class="delete-btn" onclick="deleteCard('${card.id}')">🗑️ Удалить</button>
            </div>
        `;
        elements.cardsContainer.appendChild(cardElement);
    });
}

// Добавляем функции в глобальную область видимости
window.showSection = showSection;
window.editCard = editCard;
window.deleteCard = deleteCard;
window.deleteSection = deleteSection;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', init);

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker зарегистрирован:', registration);
            })
            .catch(error => {
                console.log('Ошибка регистрации Service Worker:', error);
            });
    });
}
