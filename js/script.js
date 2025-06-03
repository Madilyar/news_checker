// js/script.js

// Переносимо всі функції на верхній рівень, щоб вони були доступні до того, як DOM завантажиться
// (хоча DOMContentLoaded і так гарантує, що вони будуть визначені до використання)

// Функція для отримання класу CSS на основі risk_level
function getAnalysisStatusClass(riskLevel) {
    if (riskLevel === null || riskLevel === undefined) return 'status-neutral'; // Додаємо перевірку
    const lowerRiskLevel = riskLevel.toLowerCase(); // Приводимо до нижнього регістру для гнучкості

    // Можливо, ваші значення з Python можуть бути англійською або українською.
    // Рекомендую зробити мапінг тут, якщо потрібно.
    // Або переконайтеся, що значення в БД точно відповідають case.
    // Я додав більш гнучкі перевірки, які включають слова, якщо у вас можуть бути різні варіації
    if (lowerRiskLevel.includes('підтверджено') || lowerRiskLevel.includes('verified') || lowerRiskLevel.includes('правдиво')) {
        return "status-verified";
    }
    if (lowerRiskLevel.includes('маніпуляція') || lowerRiskLevel.includes('упередженість') || lowerRiskLevel.includes('questionable') || lowerRiskLevel.includes('оманлива') || lowerRiskLevel.includes('сумнівно')) {
        return "status-questionable";
    }
    if (lowerRiskLevel.includes('неправдиві') || lowerRiskLevel.includes('фейк') || lowerRiskLevel.includes('false') || lowerRiskLevel.includes('дезінформація')) {
        return "status-false";
    }
    return "status-neutral"; // для інших випадків
}

// Функція для отримання тексту для analysis-label
function getAnalysisLabel(riskLevel) {
    if (riskLevel === null || riskLevel === undefined) return 'Аналіз невідомий'; // Додаємо перевірку
    const lowerRiskLevel = riskLevel.toLowerCase();

    if (lowerRiskLevel.includes('підтверджено') || lowerRiskLevel.includes('verified') || lowerRiskLevel.includes('правдиво')) {
        return "Перевірена інформація";
    }
    if (lowerRiskLevel.includes('маніпуляція') || lowerRiskLevel.includes('упередженість')) {
        return "Маніпуляція / Упередженість";
    }
    if (lowerRiskLevel.includes('фейк') || lowerRiskLevel.includes('дезінформація') || lowerRiskLevel.includes('неправдиві')) {
        return "Виявлено дезінформацію";
    }
    if (lowerRiskLevel.includes('потребує перевірки') && lowerRiskLevel.includes('клікбейт')) {
        return "Потребує перевірки (Клікбейт)";
    }
    if (lowerRiskLevel.includes('потребує перевірки') && lowerRiskLevel.includes('необ\'єктивно')) {
        return "Потребує перевірки (Необ'єктивно)";
    }
    if (lowerRiskLevel.includes('потенційно оманлива')) {
        return "Потенційно оманлива";
    }
    return "Аналіз невідомий";
}


// Функція для отримання назви джерела з URL сторінки
function getSourceFromUrl() {
    const path = window.location.pathname; // Отримуємо шлях
    const fileName = path.substring(path.lastIndexOf('/') + 1); // Отримуємо ім'я файлу

    switch (fileName) {
        case 'index.html':
            return 'Українська правда';
        case 'News on tsn.html':
            return 'Новини на tsn.ua';
        case 'The Daily Caller.html':
            return 'The Daily Caller';
        default:
            return 'Українська правда'; // Або інше джерело за замовчуванням, якщо не знайдено
    }
}

// Функція для встановлення активного класу в бічній панелі
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-list a');
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    navLinks.forEach(link => {
        link.classList.remove('active'); // Видаляємо клас active з усіх посилань
        // Порівнюємо href посилання з поточною назвою файлу
        if (link.getAttribute('href') === currentFileName) {
            link.classList.add('active');
        }
    });
}

// Функція для форматування дати
function formatNewsDate(isoDateString) {
    if (!isoDateString) return "Невідома дата";
    try {
        const date = new Date(isoDateString);
        if (isNaN(date.getTime())) {
            // Якщо не парситься "Mon, 02 Jun 2025 21:35:26 +0300"
            const parts = isoDateString.split(' ');
            if (parts.length >= 5) {
                const day = parts[1];
                const month = parts[2];
                const year = parts[3];
                const time = parts[4];
                const dateUtc = new Date(`${day} ${month} ${year} ${time} UTC`);
                return dateUtc.toLocaleString('uk-UA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hourCycle: 'h23'
                });
            }
            return isoDateString;
        }
        return date.toLocaleString('uk-UA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        });
    } catch (e) {
        console.error("Помилка форматування дати:", e);
        return isoDateString;
    }
}

// головна функція: Завантаження та відображення новин
async function fetchAndDisplayNews() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) {
        console.error("Елемент .news-grid не знайдено на сторінці.");
        return;
    }
    newsGrid.innerHTML = ''; // чистка сітки перед завантаженням нових даних

    const requestedSource = getSourceFromUrl(); // отримуємо джерело для фільтрації

    try {
        const response = await fetch('data/news.json'); // шлях до JSON-файлу
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allNewsData = await response.json();

        // Фільтр новин за джерелом
        const filteredNews = allNewsData.filter(newsItem => {
            // Перевірте: newsItem.source має точно відповідати requestedSource
            return requestedSource === 'all' || newsItem.source === requestedSource;
        });

        if (filteredNews.length === 0) {
            newsGrid.innerHTML = '<p>Новин для цього джерела поки що немає.</p>';
            return;
        }

        // Рендеринг відфільтрованих новин
        filteredNews.forEach(newsItem => {
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';

            const analysisStatusClass = getAnalysisStatusClass(newsItem.risk_level);
            const analysisLabelText = getAnalysisLabel(newsItem.risk_level);
            const formattedDate = formatNewsDate(newsItem.published);

            newsCard.innerHTML = `
                <div class="source-name">${newsItem.source || 'Невідоме джерело'}</div>
                <h3 class="headline"><a href="${newsItem.link}" target="_blank">${newsItem.title}</a></h3>
                <div class="news-date">${formattedDate}</div>
                <div class="analysis ${analysisStatusClass}">
                    <div class="analysis-label">${analysisLabelText}</div>
                    <div class="analysis-text">
                        ${newsItem.overall_summary || 'Резюме аналізу відсутнє.'}
                        ${newsItem.manipulation_present ? `<br>Маніпуляція: ${newsItem.manipulation_explanation}` : ''}
                        ${newsItem.false_claims_present ? `<br>Неправдиві твердження: ${newsItem.false_claims_explanation}` : ''}
                        ${newsItem.clickbait_present ? `<br>Клікбейт: ${newsItem.clickbait_explanation}` : ''}
                    </div>
                </div>
            `;
            newsGrid.appendChild(newsCard);
        });

    } catch (error) {
        console.error("Помилка завантаження або відображення новин:", error);
        newsGrid.innerHTML = '<p style="color: red;">Помилка завантаження новин. Спробуйте пізніше.</p>';
    }
}

// Єдиний DOMContentLoaded слухач
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink(); // Встановити активне посилання
    fetchAndDisplayNews(); // Завантажити та відобразити новини
});
