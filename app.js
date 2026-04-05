const tempElement = document.getElementById('temp-value');
const windElement = document.getElementById('wind-value');
const precipitationElement = document.getElementById('precip-value');
const searchBtn = document.querySelector('button');
const cityInput = document.querySelector('input');
const tenDays = document.getElementById('forecast-container');


const weatherDescriptions = {
  0: {label: "Ясно", icon: "☀️"},
  1: {label: "Преимущественно ясно", icon: "🌤️"},
  2: {label: "Переменная облачность", icon: "⛅"},
  3: {label: "Пасмурно", icon: "☁️"},

  // Туман
  45: {label: "Туман", icon: "🌁"},
  48: {label: "Иней с туманом", icon: "❄️🌁"},

  // Морось (Drizzle) - легкие капли
  51: {label: "Легкая морось", icon: "🌦️"},
  53: {label: "Умеренная морось", icon: "🌦️"},
  55: {label: "Плотная морось", icon: "🌧️"},
  56: {label: "Ледяная морось: легкая", icon: "🌨️"},
  57: {label: "Ледяная морось: плотная", icon: "🌨️"},

  // Дождь
  61: {label: "Слабый дождь", icon: "🌧️"},
  63: {label: "Умеренный дождь", icon: "🌧️🌧️"},
  65: {label: "Сильный дождь", icon: "🌧️🌧️🌧️"},
  66: {label: "Слабый ледяной дождь", icon: "❄️🌧️"},
  67: {label: "Сильный ледяной дождь", icon: "❄️❄️🌧️"},

  // Снег
  71: {label: "Легкий снегопад", icon: "❄️️"},
  73: {label: "Умеренный снегопад", icon: "❄️❄️"},
  75: {label: "Сильный снегопад", icon: "❄️❄️❄️"},
  77: {label: "Снежные зерна (град)", icon: "💎"},

  // Ливни
  80: {label: "Слабый ливень", icon: "🌦️"},
  81: {label: "Умеренный ливень", icon: "🌧️"},
  82: {label: "Сильный ливень", icon: "⛈️"},

  // Снежные ливни
  85: {label: "Слабый снежный ливень", icon: "❄️🌧️"},
  86: {label: "Сильный снежный ливень", icon: "❄️❄️🌧️"},

  // Грозы
  95: {label: "Гроза", icon: "⚡"},
  96: {label: "Гроза с небольшим градом", icon: "⛈️⚡"},
  99: {label: "Гроза с крупным градом", icon: "💎⚡"}
};

const OLLAMA_URL = 'https://creator-primary-valuation-well.trycloudflare.com/api/generate';

  async function getAiAdvice(cityName, json) {
  const loader = document.getElementById('ai-loader');
  const aiTextField = document.getElementById('ai-response');

  const promptText = `Ты погодный помощник. Сейчас в городе ${cityName}: температура ${json.current.temperature_2m}°C, ветер ${json.current.wind_speed_10m} км/ч. Дай короткий совет (1-2 предложения): что надеть?`;

  loader.style.display = 'inline-block';
  aiTextField.textContent = 'ИИ анализирует погоду...';


  try {
    const responseAi = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3:8b",
        prompt: promptText,
        stream: false,
      })
    });

    if (responseAi.ok) {
      const dataAi = await responseAi.json();
      aiTextField.textContent = dataAi.response;
    } else {
      aiTextField.textContent = "Не удалось получить совет.";
    }
  } catch (error) {
    aiTextField.textContent = "Запустите Ollama для совета.";
    console.error("Ошибка Ollama:", error);
  } finally {
    loader.style.display = 'none';
  }
}

async function getWeather() {
  let cityName = cityInput.value;
  if (cityName === "") return;


  let urlCity = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=ru&format=json`;

  try {
    let responseCity = await fetch(urlCity);
    let dataCity = await responseCity.json();

    if (!dataCity.results) {
      alert("Город не найден");
      return;
    }

    let lat = dataCity.results[0].latitude;
    let lon = dataCity.results[0].longitude;
    let correctName = dataCity.results[0].name;



    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
    let urlDayCard = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code&hourly=temperature_2m&forecast_days=14`;


    let [res1, res2] = await Promise.all([
      fetch(url),
      fetch(urlDayCard)
    ]);

    if (res1.ok && res2.ok) {
      let dataCurrent = await res1.json();
      let dataForecast = await res2.json();

      tenDays.innerHTML = "";

      for (let i = 0; i < 14; i++) {

        let date = new Date();
        date.setDate(date.getDate() + i);
        let dayName = date.toLocaleDateString('ru-RU', {weekday: 'short'});
        let dayNum = date.getDate();

        let code = dataForecast.daily.weather_code[i];
        let temp = dataForecast.hourly.temperature_2m[12 + (i * 24)];
        let info = weatherDescriptions[code] || { label: "Неизвестно", icon: "❓" };

        let dayCard = document.createElement('div');
        dayCard.classList.add('day-card-item');

        dayCard.innerHTML = `
          <div class="card-date">${dayName}, ${dayNum}</div>
          <div class="card-label">${info.label}</div>
          <div class="card-icon">${info.icon}</div>
          <div class="card-temp">${Math.round(temp)}°</div>
         
  `;

        tenDays.appendChild(dayCard);
      }

      tempElement.textContent = `${dataCurrent.current.temperature_2m}°C`;
      windElement.textContent = `${dataCurrent.current.wind_speed_10m} км/ч`;


      let currentCode = dataCurrent.current.weather_code;
      let description = weatherDescriptions[currentCode] || {
        label: "Неизвестно",
        icon: "❓"
      };
      precipitationElement.textContent = `${description.label} ${description.icon}`;

      getAiAdvice(correctName, dataCurrent);
    }
  } catch (err) {
    console.error("Ошибка получения данных:", err);
  }
}

searchBtn.addEventListener('click', () => {
  console.log("Кнопка нажата");
  getWeather();
});
