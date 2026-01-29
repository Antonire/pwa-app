// Конфигурация Supabase - ЗАМЕНИТЕ НА СВОИ КЛЮЧИ!
const SUPABASE_URL = 'https://ваш-проект.supabase.co';
const SUPABASE_ANON_KEY = 'ваш-anon-ключ';

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка подключения
async function checkSupabaseConnection() {
    try {
        console.log('Проверка подключения к Supabase...');
        const { data, error } = await supabase
            .from('home_posts')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ Ошибка подключения:', error);
            return false;
        }
        
        console.log('✅ Подключение к Supabase успешно');
        return true;
    } catch (error) {
        console.error('❌ Ошибка подключения:', error);
        return false;
    }
}

// Состояние приложения
const state = {
    currentPage: 'home',
    currentSection: null,
    sections: [],
    isLoading: false
};

// DOM элементы
const elements = {
    // ... (все ваши элементы остаются без изменений) ...
};

// ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ФАЙЛА ==========
async function uploadFile(file, bucket = 'images') {
    try {
        console.log('🔄 Начинаю загрузку файла...', {
            name: file.name,
            size: file.size,
            type: file.type
        });
        
        // Создаем уникальное имя БЕЗ кириллицы
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const fileExt = file.name.split('.').pop().toLowerCase() || 'jpg';
        const fileName = `${timestamp}-${random}.${fileExt}`;
        
        console.log('📁 Новое имя файла:', fileName);
        
        // Загружаем файл
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('❌ Ошибка загрузки в Storage:', error);
            
            // Проверяем существование бакета
            const { data: buckets } = await supabase.storage.listBuckets();
            console.log('Доступные бакеты:', buckets);
            
            if (!buckets.find(b => b.name === bucket)) {
                console.error(`❌ Бакет "${bucket}" не найден!`);
                alert(`Ошибка: бакет "${bucket}" не найден. Создайте его в Supabase Storage.`);
            }
            
            throw error;
        }
        
        console.log('✅ Файл загружен, ID:', data?.id);
        
        // Получаем публичный URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        const publicUrl = urlData?.publicUrl;
        console.log('🔗 Публичный URL:', publicUrl);
        
        return publicUrl;
        
    } catch (error) {
        console.error('🔥 Критическая ошибка загрузки файла:', error);
        return null;
    }
}

// ========== ИСПРАВЛЕННАЯ ФУНКЦИЯ СОЗДАНИЯ ПОСТА ==========
async function createHomePost(postData) {
    console.log('📝 Создание нового поста...', postData);
    
    try {
        // Валидация
        if (!postData.text?.trim() && !postData.imageFile) {
            alert('✏️ Добавьте текст или выберите фото');
            return null;
        }
        
        let imageUrl = null;
        
        // Загрузка изображения (если есть)
        if (postData.imageFile) {
            console.log('🖼️ Загружаю изображение...');
            imageUrl = await uploadFile(postData.imageFile);
            
            if (!imageUrl) {
                console.warn('⚠️ Изображение не загружено, но продолжаем создание поста...');
                // Продолжаем без изображения
            }
        }
        
        // Подготовка данных для Supabase
        const postToInsert = {
            text: postData.text?.trim() || '',
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };
        
        console.log('📤 Отправляю в Supabase:', postToInsert);
        
        // Вставляем в базу
        const { data, error } = await supabase
            .from('home_posts')
            .insert([postToInsert])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Ошибка Supabase:', error);
            
            // Проверяем существование таблицы
            const { data: tables } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
            
            console.log('Доступные таблицы:', tables);
            
            throw new Error(`Не удалось создать пост: ${error.message}`);
        }
        
        console.log('✅ Пост успешно создан:', data);
        
        // Обновляем интерфейс
        await loadHomePosts();
        
        // Очищаем форму
        elements.textInput.value = '';
        elements.imageInput.value = '';
        
        // Показываем уведомление
        showNotification('Пост успешно добавлен!', 'success');
        
        return data;
        
    } catch (error) {
        console.error('🔥 Ошибка создания поста:', error);
        
        // Подробное сообщение об ошибке
        let errorMessage = 'Неизвестная ошибка';
        
        if (error.message.includes('network')) {
            errorMessage = 'Проблема с интернет-соединением';
        } else if (error.message.includes('permission')) {
            errorMessage = 'Нет прав для создания постов. Проверьте RLS политики в Supabase';
        } else if (error.message.includes('home_posts')) {
            errorMessage = 'Таблица "home_posts" не найдена. Создайте её в Supabase';
        } else {
            errorMessage = error.message;
        }
        
        alert(`❌ Ошибка: ${errorMessage}`);
        return null;
    }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#ff4444'};
        color: white;
        border-radius: 8px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Проверка и создание таблицы (если нужно)
async function ensureTableExists() {
    console.log('🔍 Проверяю структуру базы данных...');
    
    try {
        // Проверяем таблицу home_posts
        const { data, error } = await supabase
            .from('home_posts')
            .select('*')
            .limit(1);
        
        if (error && error.code === '42P01') { // Таблица не существует
            console.warn('⚠️ Таблица home_posts не существует!');
            
            if (confirm('Таблица "home_posts" не найдена. Создать автоматически?')) {
                // Можно выполнить SQL через Supabase SQL Editor
                alert('Перейдите в Supabase -> SQL Editor и выполните:\n\n' +
                      'CREATE TABLE home_posts (\n' +
                      '  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,\n' +
                      '  text TEXT,\n' +
                      '  image_url TEXT,\n' +
                      '  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n' +
                      ');\n\n' +
                      'CREATE POLICY "Enable all for anon" ON home_posts\n' +
                      'FOR ALL USING (true);');
            }
        } else {
            console.log('✅ Таблица home_posts существует');
        }
    } catch (error) {
        console.error('Ошибка проверки таблицы:', error);
    }
}

// ========== ОСТАЛЬНОЙ КОД ==========
// ... (остальные функции остаются без изменений, но используйте исправленные версии) ...

// Инициализация приложения
async function init() {
    console.log('🚀 Инициализация приложения...');
    
    // Проверка подключения
    const connected = await checkSupabaseConnection();
    if (!connected) {
        alert('Не удалось подключиться к базе данных. Проверьте ключи Supabase и интернет-соединение.');
    }
    
    // Проверка структуры БД
    await ensureTableExists();
    
    // ... остальная инициализация ...
    
    console.log('✅ Приложение инициализировано');
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
