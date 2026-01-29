// Конфигурация Supabase - ЗАМЕНИТЕ НА СВОИ КЛЮЧИ!
const SUPABASE_URL = 'https://byoqijcuomiadpvybgow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Eig0dXlTKXymE2O0JSeh7w_H6n5Oeho';

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Состояние приложения
const state = {
    currentPage: 'home',
    currentSection: null,
    sections: [],
    isLoading: false
};

// DOM элементы
const elements = {
    // Кебаб-меню
    kebabBtn: document.getElementById('kebab-btn'),
    kebabDropdown: document.getElementById('kebab-dropdown'),
    goHomeBtn: document.getElementById('go-home'),
    newSectionBtn: document.getElementById('new-section-btn'),
    sectionsList: document.getElementById('sections-list'),
    
    // Модалки
    newSectionModal: document.getElementById('new-section-modal'),
    sectionNameInput: document.getElementById('section-name'),
    saveSectionBtn: document.getElementById('save-section-btn'),
    cancelSectionBtn: document.getElementById('cancel-section-btn'),
    
    // Страницы
    homePage: document.getElementById('home-page'),
    sectionPage: document.getElementById('section-page'),
    pageTitle: document.getElementById('page-title'),
    
    // Главная страница
    imageInput: document.getElementById('image-input'),
    textInput: document.getElementById('text-input'),
    addPostBtn: document.getElementById('add-post-btn'),
    homePostsContainer: document.getElementById('home-posts-container'),
    
    // Страница раздела
    sectionTitle: document.getElementById('section-title'),
    cardsContainer: document.getElementById('cards-container'),
    addCardBtn: document.getElementById('add-card-btn'),
    
    // Модалка карточки
    cardModal: document.getElementById('card-modal'),
    cardLocation: document.getElementById('card-location'),
    cardDescription: document.getElementById('card-description'),
    cardImageInput: document.getElementById('card-image-input'),
    saveCardBtn: document.getElementById('save-card-btn'),
    cancelCardBtn: document.getElementById('cancel-card-btn'),
    
    // Подтверждение удаления
    confirmModal: document.getElementById('confirm-modal'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn')
};

// Загрузка данных с Supabase
async function loadData() {
    state.isLoading = true;
    showLoading();
    
    try {
        // Загружаем разделы
        const { data: sections, error: sectionsError } = await supabase
            .from('sections')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (sectionsError) throw sectionsError;
        state.sections = sections || [];
        
        // Загружаем посты главной страницы
        await loadHomePosts();
        
        // Рендерим список разделов
        renderSectionsList();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert('Не удалось загрузить данные. Проверьте подключение к интернету.');
    } finally {
        state.isLoading = false;
        hideLoading();
    }
}

// Загрузка постов главной страницы
async function loadHomePosts() {
    try {
        const { data: posts, error } = await supabase
            .from('home_posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderHomePosts(posts || []);
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
    }
}

// Загрузка карточек раздела
async function loadSectionCards(sectionId) {
    try {
        const { data: cards, error } = await supabase
            .from('cards')
            .select('*')
            .eq('section_id', sectionId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        renderCards(cards || []);
    } catch (error) {
        console.error('Ошибка загрузки карточек:', error);
    }
}

// Загрузка файла в Supabase Storage
async function uploadFile(file, bucket = 'images') {
    try {
        // Создаем уникальное имя файла
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // Загружаем файл
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);
        
        if (error) throw error;
        
        // Получаем публичный URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        return null;
    }
}

// Создание нового раздела
async function createSection(name) {
    try {
        const { data, error } = await supabase
            .from('sections')
            .insert([{ name }])
            .select()
            .single();
        
        if (error) throw error;
        
        state.sections.unshift(data);
        renderSectionsList();
        showSection(data.id);
        
        return data;
    } catch (error) {
        console.error('Ошибка создания раздела:', error);
        alert('Не удалось создать раздел');
        return null;
    }
}

// Создание карточки
async function createCard(cardData) {
    try {
        // Загружаем изображение, если есть
        let imageUrl = null;
        if (cardData.imageFile) {
            imageUrl = await uploadFile(cardData.imageFile);
        }
        
        const { data, error } = await supabase
            .from('cards')
            .insert([{
                section_id: cardData.sectionId,
                location: cardData.location,
                description: cardData.description,
                image_url: imageUrl
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Перезагружаем карточки
        await loadSectionCards(cardData.sectionId);
        
        return data;
    } catch (error) {
        console.error('Ошибка создания карточки:', error);
        alert('Не удалось создать карточку');
        return null;
    }
}

// Создание поста на главной
async function createHomePost(postData) {
    try {
        // Загружаем изображение, если есть
        let imageUrl = null;
        if (postData.imageFile) {
            imageUrl = await uploadFile(postData.imageFile);
        }
        
        const { data, error } = await supabase
            .from('home_posts')
            .insert([{
                text: postData.text,
                image_url: imageUrl
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // Перезагружаем посты
        await loadHomePosts();
        
        return data;
    } catch (error) {
        console.error('Ошибка создания поста:', error);
        alert('Не удалось создать пост');
        return null;
    }
}

// Удаление карточки
async function deleteCard(cardId) {
    try {
        const { error } = await supabase
            .from('cards')
            .delete()
            .eq('id', cardId);
        
        if (error) throw error;
        
        // Перезагружаем карточки текущего раздела
        if (state.currentSection) {
            await loadSectionCards(state.currentSection);
        }
    } catch (error) {
        console.error('Ошибка удаления карточки:', error);
        alert('Не удалось удалить карточку');
    }
}

// Удаление раздела
async function deleteSection(sectionId) {
    try {
        const { error } = await supabase
            .from('sections')
            .delete()
            .eq('id', sectionId);
        
        if (error) throw error;
        
        // Обновляем состояние
        state.sections = state.sections.filter(s => s.id !== sectionId);
        renderSectionsList();
        
        // Если удалили текущий раздел, переходим на главную
        if (state.currentSection === sectionId) {
            showHomePage();
        }
    } catch (error) {
        console.error('Ошибка удаления раздела:', error);
        alert('Не удалось удалить раздел');
    }
}

// Рендеринг функций
function renderSectionsList() {
    elements.sectionsList.innerHTML = '';
    
    state.sections.forEach(section => {
        const sectionItem = document.createElement('div');
        sectionItem.className = 'menu-item';
        sectionItem.innerHTML = `
            <span>📁 ${section.name}</span>
            <button class="delete-section-btn" data-id="${section.id}">🗑️</button>
        `;
        
        sectionItem.querySelector('.delete-section-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Удалить раздел "${section.name}" и все карточки в нем?`)) {
                deleteSection(section.id);
            }
        });
        
        sectionItem.addEventListener('click', () => {
            showSection(section.id);
            closeKebabMenu();
        });
        
        elements.sectionsList.appendChild(sectionItem);
    });
}

function renderHomePosts(posts) {
    elements.homePostsContainer.innerHTML = '';
    
    if (posts.length === 0) {
        elements.homePostsContainer.innerHTML = `
            <div class="post">
                <p style="text-align: center; color: #666;">Пока нет постов. Добавьте первый!</p>
            </div>
        `;
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            ${post.image_url ? `<img src="${post.image_url}" alt="Post" class="card-image">` : ''}
            <p>${post.text}</p>
            <div class="card-date">${new Date(post.created_at).toLocaleDateString('ru-RU')}</div>
        `;
        elements.homePostsContainer.appendChild(postElement);
    });
}

function renderCards(cards) {
    elements.cardsContainer.innerHTML = '';
    
    if (cards.length === 0) {
        elements.cardsContainer.innerHTML = `
            <div class="card">
                <p style="text-align: center; color: #666;">В этом разделе пока нет карточек. Добавьте первую!</p>
            </div>
        `;
        return;
    }
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <div class="card-header">
                <h3 class="card-location">${card.location}</h3>
                <span class="card-date">${new Date(card.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            ${card.image_url ? `<img src="${card.image_url}" alt="${card.location}" class="card-image">` : ''}
            <p class="card-description">${card.description}</p>
            <div class="card-actions">
                <button class="delete-btn" data-id="${card.id}">🗑️ Удалить</button>
            </div>
        `;
        
        cardElement.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmModal(card.id, 'card');
        });
        
        elements.cardsContainer.appendChild(cardElement);
    });
}

// Навигация
function showHomePage() {
    state.currentPage = 'home';
    state.currentSection = null;
    
    elements.homePage.classList.remove('hidden');
    elements.sectionPage.classList.add('hidden');
    elements.pageTitle.textContent = 'Главная страница';
    
    loadHomePosts();
}

async function showSection(sectionId) {
    state.currentPage = 'section';
    state.currentSection = sectionId;
    
    const section = state.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    elements.homePage.classList.add('hidden');
    elements.sectionPage.classList.remove('hidden');
    elements.pageTitle.textContent = section.name;
    elements.sectionTitle.textContent = section.name;
    
    await loadSectionCards(sectionId);
}

// Вспомогательные функции
function showLoading() {
    // Можно добавить индикатор загрузки
}

function hideLoading() {
    // Скрыть индикатор загрузки
}

function toggleKebabMenu() {
    elements.kebabDropdown.classList.toggle('show');
}

function closeKebabMenu() {
    elements.kebabDropdown.classList.remove('show');
}

function showNewSectionModal() {
    elements.sectionNameInput.value = 'Новый раздел';
    elements.newSectionModal.classList.remove('hidden');
    elements.sectionNameInput.focus();
    elements.sectionNameInput.select();
}

function hideNewSectionModal() {
    elements.newSectionModal.classList.add('hidden');
}

function showCardModal() {
    elements.cardLocation.value = '';
    elements.cardDescription.value = '';
    elements.cardImageInput.value = '';
    elements.cardModal.classList.remove('hidden');
    document.getElementById('modal-title').textContent = 'Новая карточка';
}

function hideCardModal() {
    elements.cardModal.classList.add('hidden');
}

function showConfirmModal(itemId, type) {
    elements.confirmModal.classList.remove('hidden');
    elements.confirmDeleteBtn.dataset.id = itemId;
    elements.confirmDeleteBtn.dataset.type = type;
}

function hideConfirmModal() {
    elements.confirmModal.classList.add('hidden');
    elements.confirmDeleteBtn.dataset.id = '';
    elements.confirmDeleteBtn.dataset.type = '';
}

// Инициализация приложения
async function init() {
    // Настройка обработчиков событий
    elements.kebabBtn.addEventListener('click', toggleKebabMenu);
    elements.goHomeBtn.addEventListener('click', showHomePage);
    elements.newSectionBtn.addEventListener('click', showNewSectionModal);
    
    // Модалка раздела
    elements.saveSectionBtn.addEventListener('click', async () => {
        const name = elements.sectionNameInput.value.trim();
        if (name) {
            await createSection(name);
            hideNewSectionModal();
        }
    });
    
    elements.cancelSectionBtn.addEventListener('click', hideNewSectionModal);
    
    // Главная страница
    elements.addPostBtn.addEventListener('click', async () => {
        const text = elements.textInput.value.trim();
        const imageFile = elements.imageInput.files[0];
        
        if (!text && !imageFile) {
            alert('Добавьте текст или фото');
            return;
        }
        
        await createHomePost({ text, imageFile });
        elements.textInput.value = '';
        elements.imageInput.value = '';
    });
    
    // Страница раздела
    elements.addCardBtn.addEventListener('click', showCardModal);
    
    // Модалка карточки
    elements.saveCardBtn.addEventListener('click', async () => {
        const location = elements.cardLocation.value.trim();
        const description = elements.cardDescription.value.trim();
        const imageFile = elements.cardImageInput.files[0];
        
        if (!location) {
            alert('Введите местоположение');
            return;
        }
        
        await createCard({
            sectionId: state.currentSection,
            location,
            description,
            imageFile
        });
        
        hideCardModal();
    });
    
    elements.cancelCardBtn.addEventListener('click', hideCardModal);
    
    // Подтверждение удаления
    elements.confirmDeleteBtn.addEventListener('click', async () => {
        const id = elements.confirmDeleteBtn.dataset.id;
        const type = elements.confirmDeleteBtn.dataset.type;
        
        if (type === 'card') {
            await deleteCard(id);
        } else if (type === 'section') {
            await deleteSection(id);
        }
        
        hideConfirmModal();
    });
    
    elements.cancelDeleteBtn.addEventListener('click', hideConfirmModal);
    
    // Клик вне меню
    document.addEventListener('click', (e) => {
        if (!elements.kebabBtn.contains(e.target) && 
            !elements.kebabDropdown.contains(e.target)) {
            closeKebabMenu();
        }
    });
    
    // Загрузка данных
    await loadData();
    showHomePage();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);

// Service Worker для PWA
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
