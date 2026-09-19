const API_URL =
  'https://script.google.com/macros/s/AKfycbwHxlJ88cbVc6I2VvQEMArP75DCLl-3rKwtney0Mx0LdErt_x0eqlnUB5wj08bNrR8/exec';


/* =========================
   TELEGRAM
========================= */

const tg = window.Telegram
  ? window.Telegram.WebApp
  : null;

if (tg) {
  tg.ready();
  tg.expand();

  if (tg.setHeaderColor) {
    tg.setHeaderColor('#170d24');
  }

  if (tg.setBackgroundColor) {
    tg.setBackgroundColor('#170d24');
  }
}


/* =========================
   СОСТОЯНИЕ
========================= */

const state = {
  services: [],
  additionalServices: [],

  selectedService: null,
  selectedDuration: null,
  selectedAdditionalService: null,

  selectedDate: '',
  selectedTime: '',

  name: '',
  phone: '',

  telegramId: '',
  username: ''
};


/* =========================
   DOM
========================= */

const servicesList =
  document.getElementById('services-list');

const serviceNext =
  document.getElementById('service-next');

const additionalButton =
  document.getElementById('additional-service');

const bookingDate =
  document.getElementById('booking-date');

const timesList =
  document.getElementById('times-list');

const timeNext =
  document.getElementById('time-next');

const bookingForm =
  document.getElementById('booking-form');

const errorMessage =
  document.getElementById('error-message');

const durationButtons =
  document.querySelectorAll('.duration-card');


/* =========================
   ЗАПУСК
========================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    initTelegramUser();

    setMinDate();

    setupEvents();

    loadServices();

  }
);


/* =========================
   TELEGRAM USER
========================= */

function initTelegramUser() {

  if (
    !tg ||
    !tg.initDataUnsafe ||
    !tg.initDataUnsafe.user
  ) {
    return;
  }

  const user =
    tg.initDataUnsafe.user;

  state.telegramId =
    user.id
      ? String(user.id)
      : '';

  state.username =
    user.username
      ? String(user.username)
      : '';
}


/* =========================
   ДАТА
========================= */

function setMinDate() {

  if (!bookingDate) {
    return;
  }

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, '0');

  const day =
    String(now.getDate())
      .padStart(2, '0');

  const today =
    year +
    '-' +
    month +
    '-' +
    day;

  bookingDate.min = today;

  bookingDate.value = today;

  state.selectedDate = today;

}


/* =========================
   СОБЫТИЯ
========================= */

function setupEvents() {

  /* ДАТА */

  if (bookingDate) {

    bookingDate.addEventListener(
      'change',
      function () {

        state.selectedDate =
          bookingDate.value;

        state.selectedTime = '';

        if (timeNext) {
          timeNext.disabled = true;
        }

        loadSchedule();

      }
    );

  }


  /* ДЛИТЕЛЬНОСТЬ */

  durationButtons.forEach(
    function (button) {

      button.addEventListener(
        'click',
        function () {

          const duration =
            Number(
              button.dataset.duration
            );

          selectDuration(duration);

        }
      );

    }
  );


  /* ДОПОЛНИТЕЛЬНАЯ УСЛУГА */

  if (additionalButton) {

    additionalButton.addEventListener(
      'click',
      function () {

        toggleAdditionalService();

      }
    );

  }


  /* ДАЛЕЕ ПОСЛЕ УСЛУГИ */

  if (serviceNext) {

    serviceNext.addEventListener(
      'click',
      function () {

        if (
          !state.selectedService ||
          !state.selectedDuration
        ) {
          showError(
            'Выберите услугу и длительность'
          );

          return;
        }

        showScreen('screen-time');

        updateProgress(2);

        updateServiceSummary();

        loadSchedule();

      }
    );

  }


  /* ДАЛЕЕ ПОСЛЕ ВРЕМЕНИ */

  if (timeNext) {

    timeNext.addEventListener(
      'click',
      function () {

        if (
          !state.selectedDate ||
          !state.selectedTime
        ) {
          showError(
            'Выберите время'
          );

          return;
        }

        prepareDetailsScreen();

        showScreen('screen-details');

        updateProgress(3);

      }
    );

  }


  /* НАЗАД К УСЛУГЕ */

  const backToService =
    document.querySelector(
      '[data-back="service"]'
    );

  if (backToService) {

    backToService.addEventListener(
      'click',
      function () {

        showScreen('screen-service');

        updateProgress(1);

      }
    );

  }


  /* НАЗАД К ВРЕМЕНИ */

  const backToTime =
    document.querySelector(
      '[data-back="time"]'
    );

  if (backToTime) {

    backToTime.addEventListener(
      'click',
      function () {

        showScreen('screen-time');

        updateProgress(2);

      }
    );

  }


  /* ФОРМА */

  if (bookingForm) {

    bookingForm.addEventListener(
      'submit',
      submitBooking
    );

  }

}


/* =========================
   ЗАГРУЗКА УСЛУГ
========================= */

async function loadServices() {

  try {

    if (servicesList) {

      servicesList.innerHTML =
        '<div class="empty-state">' +
        'Загрузка услуг...' +
        '</div>';

    }

    const response =
      await fetch(
        API_URL +
        '?action=getServices&ts=' +
        Date.now()
      );

    if (!response.ok) {

      throw new Error(
        'Ошибка соединения с сервером'
      );

    }

    const data =
      await response.json();

    console.log(
      'Ответ getServices:',
      data
    );

    if (!data.success) {

      throw new Error(
        data.message ||
        'Не удалось загрузить услуги'
      );

    }

    state.services =
      Array.isArray(data.services)
        ? data.services
        : [];

    state.additionalServices =
      Array.isArray(data.additionalServices)
        ? data.additionalServices
        : [];

    renderServices();

    renderAdditionalService();

  } catch (error) {

    console.error(
      'Ошибка загрузки услуг:',
      error
    );

    if (servicesList) {

      servicesList.innerHTML =
        '<div class="empty-state">' +
        'Не удалось загрузить услуги.<br>' +
        'Попробуйте открыть приложение ещё раз.' +
        '</div>';

    }

    showError(
      error.message ||
      'Ошибка загрузки услуг'
    );

  }

}


/* =========================
   ОСНОВНЫЕ УСЛУГИ
========================= */

function renderServices() {

  if (!servicesList) {
    return;
  }

  servicesList.innerHTML = '';

  if (!state.services.length) {

    servicesList.innerHTML =
      '<div class="empty-state">' +
      'Услуги пока не добавлены.' +
      '</div>';

    return;
  }


  state.services.forEach(
    function (service) {

      const button =
        document.createElement('button');

      button.type = 'button';

      button.className =
        'service-card';


      if (
        state.selectedService &&
        state.selectedService.name ===
        service.name
      ) {

        button.classList.add(
          'selected'
        );

      }


      button.innerHTML =
        '<div class="service-name">' +
          escapeHtml(
            service.name
          ) +
        '</div>' +

        '<div class="service-price">' +
          escapeHtml(
            service.price || '000 ₽'
          ) +
        '</div>' +

        '<div class="service-check">' +
          '✓' +
        '</div>';


      button.addEventListener(
        'click',
        function () {

          selectService(service);

        }
      );


      servicesList.appendChild(
        button
      );

    }
  );

}


/* =========================
   ВЫБОР УСЛУГИ
========================= */

function selectService(service) {

  state.selectedService =
    service;

  state.selectedDuration =
    null;

  state.selectedTime =
    '';

  state.selectedAdditionalService =
    null;


  renderServices();

  renderDurations();

  renderAdditionalService();


  if (serviceNext) {
    serviceNext.disabled = true;
  }

}


/* =========================
   ДЛИТЕЛЬНОСТЬ
========================= */

function renderDurations() {

  durationButtons.forEach(
    function (button) {

      const duration =
        Number(
          button.dataset.duration
        );


      const allowed =
        state.selectedService &&
        Array.isArray(
          state.selectedService.durations
        ) &&
        state.selectedService.durations
          .map(Number)
          .includes(duration);


      if (!allowed) {

        button.disabled = true;

        button.classList.add(
          'disabled'
        );

        button.classList.remove(
          'selected'
        );

        return;

      }


      button.disabled = false;

      button.classList.remove(
        'disabled'
      );


      button.classList.toggle(
        'selected',
        state.selectedDuration === duration
      );

    }
  );

}


/* =========================
   ВЫБОР ДЛИТЕЛЬНОСТИ
========================= */

function selectDuration(duration) {

  if (!state.selectedService) {

    showError(
      'Сначала выберите услугу'
    );

    return;

  }


  const allowed =
    Array.isArray(
      state.selectedService.durations
    ) &&
    state.selectedService.durations
      .map(Number)
      .includes(duration);


  if (!allowed) {
    return;
  }


  state.selectedDuration =
    duration;

  state.selectedTime =
    '';


  if (serviceNext) {

    serviceNext.disabled =
      !state.selectedService ||
      !state.selectedDuration;

  }


  renderDurations();

}


/* =========================
   ДОПОЛНИТЕЛЬНАЯ УСЛУГА
========================= */

function renderAdditionalService() {

  if (!additionalButton) {
    return;
  }


  const service =
    state.additionalServices.length
      ? state.additionalServices[0]
      : {
          name: 'Горячие камни',
          price: '000 ₽'
        };


  const name =
    service.name ||
    'Горячие камни';


  const price =
    service.price ||
    '000 ₽';


  additionalButton.innerHTML =
    '<div class="additional-info">' +

      '<span class="additional-name">' +
        escapeHtml(name) +
      '</span>' +

      '<span class="additional-price">' +
        escapeHtml(price) +
      '</span>' +

    '</div>' +

    '<span class="check-icon">✓</span>';


  additionalButton.classList.toggle(
    'selected',
    !!state.selectedAdditionalService
  );

}


/* =========================
   ВЫБОР ДОП. УСЛУГИ
========================= */

function toggleAdditionalService() {

  if (
    state.selectedAdditionalService
  ) {

    state.selectedAdditionalService =
      null;

  } else {

    state.selectedAdditionalService =
      state.additionalServices[0] ||
      {
        name: 'Горячие камни',
        price: '000 ₽'
      };

  }


  renderAdditionalService();

}


/* =========================
   РАСПИСАНИЕ
========================= */

async function loadSchedule() {

  if (
    !state.selectedDate ||
    !state.selectedDuration
  ) {

    if (timesList) {

      timesList.innerHTML =
        '<div class="no-times">' +
        'Выберите услугу, длительность и дату.' +
        '</div>';

    }

    return;

  }


  state.selectedTime =
    '';

  if (timeNext) {
    timeNext.disabled = true;
  }


  if (timesList) {

    timesList.innerHTML =
      '<div class="no-times">' +
      'Загрузка свободного времени...' +
      '</div>';

  }


  try {

    const url =
      API_URL +
      '?action=getSchedule' +
      '&date=' +
      encodeURIComponent(
        formatDateForServer(
          state.selectedDate
        )
      ) +
      '&duration=' +
      encodeURIComponent(
        state.selectedDuration
      ) +
      '&ts=' +
      Date.now();


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        'Ошибка загрузки расписания'
      );

    }


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        'Не удалось загрузить расписание'
      );

    }


    renderTimes(
      data.availableTimes || []
    );


  } catch (error) {

    console.error(
      'Ошибка расписания:',
      error
    );


    if (timesList) {

      timesList.innerHTML =
        '<div class="no-times">' +
        'Не удалось загрузить время.<br>' +
        'Попробуйте выбрать дату ещё раз.' +
        '</div>';

    }


    showError(
      error.message ||
      'Ошибка загрузки расписания'
    );

  }

}


/* =========================
   ВРЕМЯ
========================= */

function renderTimes(times) {

  if (!timesList) {
    return;
  }


  timesList.innerHTML = '';


  if (!times.length) {

    timesList.innerHTML =
      '<div class="no-times">' +
      'На выбранную дату свободного времени нет.' +
      '</div>';

    return;

  }


  times.forEach(
    function (time) {

      const button =
        document.createElement('button');

      button.type = 'button';

      button.className =
        'time-card';

      button.textContent =
        time;


      button.addEventListener(
        'click',
        function () {

          selectTime(
            time,
            button
          );

        }
      );


      timesList.appendChild(
        button
      );

    }
  );

}


/* =========================
   ВЫБОР ВРЕМЕНИ
========================= */

function selectTime(
  time,
  button
) {

  state.selectedTime =
    time;


  document
    .querySelectorAll('.time-card')
    .forEach(
      function (item) {

        item.classList.remove(
          'selected'
        );

      }
    );


  button.classList.add(
    'selected'
  );


  if (timeNext) {
    timeNext.disabled = false;
  }

}


/* =========================
   SUMMARY
========================= */

function updateServiceSummary() {

  const summary =
    document.getElementById(
      'selected-service-summary'
    );

  if (!summary || !state.selectedService) {
    return;
  }


  let text =
    state.selectedService.name +
    ' · ' +
    state.selectedDuration +
    ' ' +
    getHourWord(
      state.selectedDuration
    );


  if (state.selectedAdditionalService) {

    text +=
      ' · ' +
      state.selectedAdditionalService.name;

  }


  summary.innerHTML =
    '<div class="summary-row">' +

      '<span class="summary-label">' +
        'Выбрано' +
      '</span>' +

      '<span class="summary-value">' +
        escapeHtml(text) +
      '</span>' +

    '</div>';

}


function prepareDetailsScreen() {

  const summary =
    document.getElementById(
      'booking-summary'
    );

  if (!summary) {
    return;
  }


  let html = '';


  html +=
    createSummaryRow(
      'Услуга',
      state.selectedService
        ? state.selectedService.name
        : ''
    );


  html +=
    createSummaryRow(
      'Длительность',
      state.selectedDuration +
      ' ' +
      getHourWord(
        state.selectedDuration
      )
    );


  if (state.selectedAdditionalService) {

    html +=
      createSummaryRow(
        'Дополнительно',
        state.selectedAdditionalService.name
      );

  }


  html +=
    createSummaryRow(
      'Дата',
      formatDateForDisplay(
        state.selectedDate
      )
    );


  html +=
    createSummaryRow(
      'Время',
      getTimeRange()
    );


  summary.innerHTML =
    html;

}


/* =========================
   ОТПРАВКА ЗАПИСИ
========================= */

async function submitBooking(
  event
) {

  event.preventDefault();


  const nameInput =
    document.getElementById(
      'client-name'
    );

  const phoneInput =
    document.getElementById(
      'client-phone'
    );


  if (!nameInput || !phoneInput) {

    showError(
      'Не найдены поля для ввода данных'
    );

    return;

  }


  state.name =
    nameInput.value.trim();

  state.phone =
    phoneInput.value.trim();


  if (!state.name) {

    showError(
      'Введите ваше имя'
    );

    nameInput.focus();

    return;

  }


  if (!state.phone) {

    showError(
      'Введите номер телефона'
    );

    phoneInput.focus();

    return;

  }


  if (
    !state.selectedService ||
    !state.selectedDuration ||
    !state.selectedDate ||
    !state.selectedTime
  ) {

    showError(
      'Не все данные записи заполнены'
    );

    return;

  }


  const submitButton =
    bookingForm.querySelector(
      'button[type="submit"]'
    );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      'Создание записи...';

  }


  try {

    const payload = {

      action: 'book',

      date:
        formatDateForServer(
          state.selectedDate
        ),

      time:
        state.selectedTime,

      duration:
        state.selectedDuration,

      service:
        state.selectedService.name,

      additionalService:
        state.selectedAdditionalService
          ? state.selectedAdditionalService.name
          : '',

      name:
        state.name,

      phone:
        state.phone,

      telegramId:
        state.telegramId,

      username:
        state.username

    };


    const response =
      await fetch(
        API_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },

          body:
            JSON.stringify(
              payload
            )
        }
      );


    const data =
      await response.json();


    if (!data.success) {

      throw new Error(
        data.message ||
        'Не удалось создать запись'
      );

    }


    showSuccess(
      data
    );


  } catch (error) {

    console.error(
      'Ошибка создания записи:',
      error
    );


    showError(
      error.message ||
      'Не удалось создать запись'
    );


    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        'Подтвердить запись';

    }

  }

}


/* =========================
   УСПЕШНАЯ ЗАПИСЬ
========================= */

function showSuccess(data) {

  const details =
    document.getElementById(
      'success-details'
    );


  if (details) {

    let html = '';


    html +=
      createSummaryRow(
        'Услуга',
        state.selectedService
          ? state.selectedService.name
          : ''
      );


    html +=
      createSummaryRow(
        'Длительность',
        state.selectedDuration +
        ' ' +
        getHourWord(
          state.selectedDuration
        )
      );


    if (state.selectedAdditionalService) {

      html +=
        createSummaryRow(
          'Дополнительно',
          state.selectedAdditionalService.name
        );

    }


    html +=
      createSummaryRow(
        'Дата',
        formatDateForDisplay(
          state.selectedDate
        )
      );


    html +=
      createSummaryRow(
        'Время',
        getTimeRange()
      );


    details.innerHTML =
      html;

  }


  showScreen(
    'screen-success'
  );

}


/* =========================
   ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
========================= */

function showScreen(screenId) {

  document
    .querySelectorAll('.screen')
    .forEach(
      function (screen) {

        screen.classList.remove(
          'active'
        );

      }
    );


  const screen =
    document.getElementById(
      screenId
    );


  if (screen) {

    screen.classList.add(
      'active'
    );

  }


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


/* =========================
   ПРОГРЕСС
========================= */

function updateProgress(step) {

  document
    .querySelectorAll('.progress-step')
    .forEach(
      function (item) {

        const itemStep =
          Number(
            item.dataset.step
          );


        item.classList.toggle(
          'active',
          itemStep <= step
        );

      }
    );

}


/* =========================
   ВСПОМОГАТЕЛЬНЫЕ
========================= */

function formatDateForServer(
  value
) {

  if (!value) {
    return '';
  }


  const parts =
    value.split('-');


  if (parts.length !== 3) {
    return value;
  }


  return (
    parts[2] +
    '.' +
    parts[1] +
    '.' +
    parts[0]
  );

}


function formatDateForDisplay(
  value
) {

  if (!value) {
    return '';
  }


  const parts =
    value.split('-');


  if (parts.length !== 3) {
    return value;
  }


  return (
    parts[2] +
    '.' +
    parts[1] +
    '.' +
    parts[0]
  );

}


function getTimeRange() {

  if (
    !state.selectedTime ||
    !state.selectedDuration
  ) {

    return state.selectedTime || '';

  }


  const parts =
    state.selectedTime.split(':');


  let minutes =
    Number(parts[0]) * 60 +
    Number(parts[1]);


  minutes +=
    state.selectedDuration * 60;


  const hours =
    Math.floor(
      minutes / 60
    );


  const mins =
    minutes % 60;


  const endTime =
    String(hours).padStart(2, '0') +
    ':' +
    String(mins).padStart(2, '0');


  return (
    state.selectedTime +
    '–' +
    endTime
  );

}


function getHourWord(
  number
) {

  return Number(number) === 1
    ? 'час'
    : 'часа';

}


function createSummaryRow(
  label,
  value
) {

  return (
    '<div class="summary-row">' +

      '<span class="summary-label">' +
        escapeHtml(label) +
      '</span>' +

      '<span class="summary-value">' +
        escapeHtml(value) +
      '</span>' +

    '</div>'
  );

}


function showError(
  message
) {

  if (!errorMessage) {
    return;
  }


  errorMessage.textContent =
    message;


  errorMessage.classList.remove(
    'hidden'
  );


  clearTimeout(
    showError.timeout
  );


  showError.timeout =
    setTimeout(
      function () {

        errorMessage.classList.add(
          'hidden'
        );

      },
      5000
    );

}


function escapeHtml(
  value
) {

  return String(value)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}