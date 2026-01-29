// Конфигурация Supabase
const SUPABASE_URL = 'https://byoqijcuomiadpvybgow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5b3FpamN1b21pYWRwdnliZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDgxMjgsImV4cCI6MjA4NTI4NDEyOH0.9Cuacy-mJ8FesSyRvHaLdacZIKtnqyAcoyUFAVL5_qQ';

// Инициализация Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== ПРОСТАЯ ПРОВЕРКА ПОДКЛЮЧЕНИЯ ==========
async function checkSupabaseConnection() {
    console.log('🔍 Проверка подключения к Supabase...');
    
    try {
        // Простая проверка через таблицу home_posts
        const { data, error } = await supabase
            .from('home_posts')
            .select('*')
            .limit(1);
        
        // Если ошибка связана с таблицей (например, нет прав), но соединение есть
        if (error) {
            console.log('📊 Статус подключения к Supabase:', {
                error: error.message,
                code: error.code,
                details: error.details
            });
            
            // Проверяем тип ошибки
            if (error.code === '42501' || error.message.includes('permission')) {
                console.warn('⚠️ Подключение есть, но нет прав к таблице home_posts');
                console.log('Рекомендация: Проверьте RLS политики в Supabase');
                return true; // Подключение есть, но нет прав
            }
            
            if (error.code === '42P01') {
                console.warn('⚠️ Таблица home_posts не существует');
                return true; // Подключение есть, но таблицы нет
            }
            
            console.error('❌ Ошибка подключения:', error);
            return false;
        }
        
        console.log('✅ Подключение к Supabase успешно!');
        return true;
        
    } catch (error) {
        console.error('🔥 Критическая ошибка:', error);
        
        // Проверяем типичные ошибки
        if (error.message?.includes('Failed to fetch')) {
            console.error('❌ Сетевая ошибка или CORS');
            alert('Проблема с сетью или CORS. Проверьте:\n1. Интернет-соединение\n2. Блокировщики рекламы\n3. CORS настройки в Supabase');
        } else if (error.message?.includes('Invalid URL')) {
            console.error('❌ Неправильный URL Supabase');
            alert('Неправильный URL Supabase. Проверьте:\n1. URL в app.js\n2. URL должен быть: https://ваш-проект.supabase.co');
        }
        
        return false;
    }
}

// ========== АЛЬТЕРНАТИВНАЯ ПРОВЕРКА (если нужно) ==========
async function testSupabaseConnection() {
    console.log('🧪 Тестирую подключение разными способами...');
    
    const tests = {
        auth: false,
        storage: false,
        database: false
    };
    
    try {
        // Тест 1: Проверка Auth
        try {
            const { error } = await supabase.auth.getSession();
            tests.auth = !error || error.message.includes('not found');
            console.log(tests.auth ? '✅ Auth доступен' : '❌ Auth ошибка');
        } catch (e) {
            console.log('⚠️ Auth тест пропущен');
        }
        
        // Тест 2: Проверка Storage
        try {
            const { error } = await supabase.storage.listBuckets();
            tests.storage = !error;
            console.log(tests.storage ? '✅ Storage доступен' : '❌ Storage ошибка');
        } catch (e) {
            console.log('⚠️ Storage тест пропущен');
        }
        
        // Тест 3: Проверка Database (ваша таблица)
        try {
            const { error } = await supabase
                .from('home_posts')
                .select('count', { count: 'exact', head: true });
            tests.database = !error || error.code !== '42501';
            console.log(tests.database ? '✅ Database доступен' : '❌ Database ошибка');
        } catch (e) {
            console.log('⚠️ Database тест пропущен');
        }
        
        // Итог
        console.log('📊 Результаты тестов:', tests);
        return tests.auth || tests.storage || tests.database;
        
    } catch (error) {
        console.error('Ошибка тестирования:', error);
        return false;
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ С ПРОВЕРКОЙ ==========
async function initWithCheck() {
    console.log('🚀 Инициализация с проверкой подключения...');
    
    // Проверяем ключи перед подключением
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
        SUPABASE_URL.includes('ваш-проект') || 
        SUPABASE_ANON_KEY.includes('ваш-anon-ключ')) {
        
        console.error('❌ Ключи Supabase не настроены!');
        
        // Создаем уведомление прямо в интерфейсе
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff4444;
                color: white;
                padding: 15px;
                text-align: center;
                z-index: 9999;
                font-family: sans-serif;
            ">
                ⚠️ Не настроена база данных! Замените ключи в app.js на свои из Supabase
            </div>
        `;
        document.body.appendChild(warning);
        
        return;
    }
    
    // Проверка подключения
    const connected = await checkSupabaseConnection();
    
    if (!connected) {
        // Альтернативная проверка
        console.log('Пробую альтернативную проверку...');
        const altConnected = await testSupabaseConnection();
        
        if (!altConnected) {
            console.error('❌ Не удалось подключиться к Supabase');
            alert('Не удалось подключиться к базе данных. Проверьте:\n\n1. Ключи в app.js\n2. Интернет-соединение\n3. CORS настройки в Supabase');
            return;
        }
    }
    
    console.log('✅ Подключение установлено, загружаю данные...');
    
    // Загружаем данные
    await loadData();
    
    // Показываем главную страницу
    showHomePage();
    
    console.log('✅ Приложение готово!');
}

// Замените ваш текущий вызов инициализации на этот:
document.addEventListener('DOMContentLoaded', initWithCheck);
