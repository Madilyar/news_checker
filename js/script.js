// js/script.js

document.addEventListener('DOMContentLoaded', () => {

    const jsonFilePath = 'data/news.json'; // шлях до json 

    const newsGrid = document.querySelector('.news-grid'); // контейнер для новин

    // Функція для отримання класу CSS на основі risk_level
    function getAnalysisStatusClass(riskLevel) {
        switch (riskLevel) {
            case "Підтверджено":
                return "status-verified";
            case "Маніпуляція / Упередженість":
                return "status-questionable";
            case "Неправдиві твердження":
                return "status-false";
            case "Потенційно оманлива":
                return "status-questionable";
            default:
                return "status-neutral"; // для інших випадків
        }
    }

// функція для отримання тексту для analysis-label
function getAnalysisLabel(riskLevel) {
    switch (riskLevel) {
        case "Підтверджено":
            return "Перевірена інформація";
        case "Маніпуляція / Упередженість":
            return "Маніпуляція / Упередженість";
        // рядки з скрипта Python
        case "Фейк / Дезінформація":
            return "Виявлено дезінформацію";
        case "Потребує перевірки (Клікбейт)":
            return "Потребує перевірки (Клікбейт)";
        case "Потребує перевірки (Необ'єктивно)":
            return "Потребує перевірки (Необ'єктивно)";
        default:
            return "Аналіз невідомий";
    }
}

    // функція для форматування дати
    function formatNewsDate(isoDateString) {
        if (!isoDateString) return "Невідома дата";
        try {
            // перевірка, чи дата вже у форматі, який може парсити Date
            const date = new Date(isoDateString);
            if (isNaN(date.getTime())) {
                // Якщо не парситься "Mon, 02 Jun 2025 21:35:26 +0300"
                const parts = isoDateString.split(' ');
                if (parts.length >= 5) {
                    const day = parts[1];
                    const month = parts[2];
                    const year = parts[3];
                    const time = parts[4];
                    // створення дати в UTC щоб уникнути проблем з часовими поясами
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
                return isoDateString; // повернути оригінал, якщо не вдалося розібрати
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
            return isoDateString; // повернути оригінал у разі помилки
        }
    }


    // вит даних з JSON
    fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // перебираємо кожної новини з JSON і створення картки
            data.forEach(news => {
                const newsCard = document.createElement('article');
                newsCard.classList.add('news-card');

                // клас та текст для аналізу
                const analysisStatusClass = getAnalysisStatusClass(news.risk_level);
                const analysisLabelText = getAnalysisLabel(news.risk_level);
                const formattedDate = formatNewsDate(news.published);


                // HTML-структура картки новини
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
                newsGrid.appendChild(newsCard); // додаємо картку до сітки
            });
        })
        .catch(error => {
            console.error('Помилка завантаження або парсингу JSON:', error);
            newsGrid.innerHTML = '<p>Не вдалося завантажити дані новин. Будь ласка, спробуйте пізніше.</p>';
        });
});
