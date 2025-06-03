// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Шлях до вашого JSON-файлу. Важливо, щоб він був коректним відносно HTML-файлу.
    // Якщо data/news.json знаходиться поруч з index.html, то шлях "data/news.json"
    const jsonFilePath = 'data/news.json';

    const newsGrid = document.querySelector('.news-grid'); // Отримуємо контейнер для новин

    // Функція для отримання класу CSS на основі risk_level
    function getAnalysisStatusClass(riskLevel) {
        switch (riskLevel) {
            case "Підтверджено":
                return "status-verified";
            case "Маніпуляція / Упередженість":
                return "status-questionable"; // Можна створити окремий клас для маніпуляцій, якщо потрібно
            case "Неправдиві твердження":
                return "status-false";
            case "Потенційно оманлива":
                return "status-questionable";
            default:
                return "status-neutral"; // Для інших випадків
        }
    }

    // Функція для отримання тексту для analysis-label
    function getAnalysisLabel(riskLevel) {
        switch (riskLevel) {
            case "Підтверджено":
                return "Перевірена інформація";
            case "Маніпуляція / Упередженість":
                return "Маніпуляція / Упередженість";
            case "Неправдиві твердження":
                return "Виявлено дезінформацію";
            case "Потенційно оманлива":
                return "Потребує перевірки";
            default:
                return "Потребує перевірки (Необ'єктивно)";
        }
    }

    // Функція для форматування дати
    function formatNewsDate(isoDateString) {
        if (!isoDateString) return "Невідома дата";
        try {
            // Перевіряємо, чи дата вже у форматі, який може парсити Date
            const date = new Date(isoDateString);
            if (isNaN(date.getTime())) {
                // Якщо не парситься, спробуємо вручну розібрати формат "Mon, 02 Jun 2025 21:35:26 +0300"
                const parts = isoDateString.split(' ');
                if (parts.length >= 5) {
                    const day = parts[1];
                    const month = parts[2];
                    const year = parts[3];
                    const time = parts[4];
                    // Створення дати в UTC, щоб уникнути проблем з часовими поясами
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
                return isoDateString; // Повернути оригінал, якщо не вдалося розібрати
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
            return isoDateString; // Повернути оригінал у разі помилки
        }
    }


    // Витягуємо дані з JSON
    fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Перебираємо кожну новину з JSON і створюємо картку
            data.forEach(news => {
                const newsCard = document.createElement('article');
                newsCard.classList.add('news-card');

                // Отримуємо клас та текст для аналізу
                const analysisStatusClass = getAnalysisStatusClass(news.risk_level);
                const analysisLabelText = getAnalysisLabel(news.risk_level);
                const formattedDate = formatNewsDate(news.published);


                // Формуємо HTML-структуру картки новини
                newsCard.innerHTML = `
                    <div class="source-name">${news.source || 'Невідоме джерело'}</div>
                    <h3 class="headline"><a href="${news.link}" target="_blank">${news.title}</a></h3>
                    <div class="news-date">${formattedDate}</div>
                    <div class="analysis ${analysisStatusClass}">
                        <div class="analysis-label">${analysisLabelText}</div>
                        <div class="analysis-text">
                            ${news.overall_summary || 'Резюме аналізу відсутнє.'}
                            ${news.manipulation_present ? `<br>Маніпуляція: ${news.manipulation_explanation}` : ''}
                            ${news.false_claims_present ? `<br>Неправдиві твердження: ${news.false_claims_explanation}` : ''}
                            ${news.clickbait_present ? `<br>Клікбейт: ${news.clickbait_explanation}` : ''}
                        </div>
                    </div>
                `;
                newsGrid.appendChild(newsCard); // Додаємо картку до сітки
            });
        })
        .catch(error => {
            console.error('Помилка завантаження або парсингу JSON:', error);
            newsGrid.innerHTML = '<p>Не вдалося завантажити дані новин. Будь ласка, спробуйте пізніше.</p>';
        });
});
