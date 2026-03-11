const tempElement = document.getElementById('temp');
const windElement = document.getElementById('wind');
const precipitationElement = document.getElementById('precipitation');
const iconElement = document.getElementById('icon');

async function getWeather() {

  let cityName = cityInput.value;
  if (cityName === "") {
    return
  }

  let urlCity = `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=10&language=ru&format=json`;

  let responseCity = await fetch(urlCity);
  let dataCity = await responseCity.json();

  if (!dataCity.results) {
    alert("Город не найден");
    return;
  }

  let lat = dataCity.results[0].latitude;
  let lon = dataCity.results[0].longitude;

  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m`;
  let response = await fetch(url);


  if (response.ok) {
    let json = await response.json();
    tempElement.textContent = `Температура: ${json.current.temperature_2m}°C`;
    windElement.textContent = `Ветер: ${json.current.wind_speed_10m} км/ч`;

    const promptText = `Ты погодный помощник. Сейчас в городе ${cityName}: температура ${json.current.temperature_2m}°C, ветер ${json.current.wind_speed_10m} км/ч. Дай короткий совет (1-2 предложения): что надеть и нужен ли зонт?`;
    try {
      const responseAi = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen3:8b",
          prompt: promptText,
          stream: false,
        })
      });

      if (responseAi.ok) {
        const dataAi = await responseAi.json();
        document.getElementById('ai-response').textContent = dataAi.response;
      } else {
        const errorText = await responseAi.text();
        console.error("Ответ сервера:", errorText);
      }
    } catch (error) {
      console.error("Ошибка связи с Ollama:", error);
    }
  } else {
    alert("Ошибка HTTP:" + response.status);
  }
}

const searchBtn = document.querySelector('button');
const cityInput = document.querySelector('input');

searchBtn.addEventListener('click', () => {
  console.log("Кнопка нажата");
  getWeather();
});