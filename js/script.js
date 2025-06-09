// js/script.js

// Функція для отримання класу CSS на основі risk_level
function getAnalysisStatusClass(riskLevel) {
    if (riskLevel === null || riskLevel === undefined) return 'status-neutral';
    const lowerRiskLevel = riskLevel.toLowerCase();

    if (lowerRiskLevel.includes('підтверджено') || lowerRiskLevel.includes('verified') || lowerRiskLevel.includes('правдиво')) {
        return "status-verified";
    }
    if (lowerRiskLevel.includes('маніпуляція') || lowerRiskLevel.includes('упередженість') || lowerRiskLevel.includes('questionable') || lowerRiskLevel.includes('оманлива') || lowerRiskLevel.includes('сумнівно')) {
        return "status-questionable";
    }
    if (lowerRiskLevel.includes('неправдиві') || lowerRiskLevel.includes('фейк') || lowerRiskLevel.includes('false') || lowerRiskLevel.includes('дезінформація')) {
        return "status-false";
    }
    return "status-neutral";
}

// Функція для отримання тексту для analysis-label
function getAnalysisLabel(riskLevel) {
    if (riskLevel === null || riskLevel === undefined) return 'Аналіз невідомий';
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
    // Порядок має значення: більш специфічні правила спочатку
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
    const path = window.location.pathname;
    const fileName = path.substring(path.lastIndexOf('/') + 1);

    switch (fileName) {
        case 'index.html':
            return 'Українська правда';
        case 'tsn.html':
            return 'Новини на tsn.ua';
        case 'dailycaller.html':
            return 'The Daily Caller';
        default:
            return 'Українська правда'; // Джерело за замовчуванням
    }
}

// Функція для встановлення активного класу в бічній панелі
function setActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-list a');
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.substring(currentPath.lastIndexOf('/') + 1);

    navLinks.forEach(link => {
        link.classList.remove('active');
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
        const response = await fetch('data/news.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const allNewsData = await response.json();

        // 1. Фільтруємо новини за джерелом
        const filteredNews = allNewsData.filter(newsItem => {
            return requestedSource === 'all' || newsItem.source === requestedSource;
        });

        if (filteredNews.length === 0) {
            newsGrid.innerHTML = '<p>Новин для цього джерела поки що немає.</p>';
            return;
        }

        // 2. Сортуємо відфільтровані новини за датою (від найновіших до найстаріших)
        // Використовуємо 'created_at' для сортування, якщо він є, інакше 'published'
        const sortedAndFilteredNews = filteredNews.sort((a, b) => {
            const dateA = new Date(a.created_at || a.published);
            const dateB = new Date(b.created_at || b.published);
            return dateB - dateA; // Сортування за спаданням (найновіші першими)
        });

        // 3. Беремо лише перші 6 новин з відсортованого та відфільтрованого списку
        const latestSixNews = sortedAndFilteredNews.slice(0, 6);

        // 4. Рендеринг вибраних 6 новин
        latestSixNews.forEach(newsItem => {
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';

            const analysisStatusClass = getAnalysisStatusClass(newsItem.risk_level);
            const analysisLabelText = getAnalysisLabel(newsItem.risk_level);
            const formattedDate = formatNewsDate(newsItem.published);

            // Перевірка на існування newsItem.link перед використанням
            const newsLink = newsItem.link ? newsItem.link : '#'; // Заглушка, якщо посилання немає
            const newsTitle = newsItem.title || 'Заголовок відсутній'; // Заглушка, якщо заголовок немає


            newsCard.innerHTML = `
                <div class="source-name">${newsItem.source || 'Невідоме джерело'}</div>
                <h3 class="headline"><a href="${newsLink}" target="_blank">${newsTitle}</a></h3>
                <div class="news-date">${formattedDate}</div>
                <div class="analysis ${analysisStatusClass}">
                    <div class="analysis-label">${analysisLabelText}</div>
                    <div class="analysis-text">
                        ${newsItem.overall_summary || 'Резюме аналізу відсутнє.'}
                        ${newsItem.manipulation_present ? `<br>Маніпуляція: ${newsItem.manipulation_explanation || 'Деталі відсутні.'}` : ''}
                        ${newsItem.false_claims_present ? `<br>Неправдиві твердження: ${newsItem.false_claims_explanation || 'Деталі відсутні.'}` : ''}
                        ${newsItem.clickbait_present ? `<br>Клікбейт: ${newsItem.clickbait_explanation || 'Деталі відсутні.'}` : ''}
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
