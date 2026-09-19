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

const additionalServicesList =
  document.getElementById('additional-services-list');

const durationSection =
  document.getElementById('duration-section');

const additionalSection =
  document.getElementById('additional-section');

const serviceNext =
  document.getElementById('service-next');

const bookingDate =
  document.getElementById('booking-date');

const timesList =
  document.getElementById('times-list');

const timeNext =
  document.getElementById('time-next');

const bookingForm =
  document.getElementById('booking-form');

const bookingSubmit =
  document.getElementById('booking-submit');

const errorMessage =
  document.getElementById('error-message');


/* =========================
   ЗАПУСК
========================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    initTelegramUser();

    setMinDate();

    loadServices();

    setupEvents();

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
    year + '-' + month + '-' + day;

  bookingDate.min = today;

  /*
   * Сразу ставим сегодняшнюю дату.
   * Сервер сам решит, какие времена
   * доступны сегодня.
   */
  bookingDate.value = today;

}


/* =========================
   СОБЫТИЯ
========================= */

function setupEvents() {

  bookingDate.addEventListener(
    'change',
    function () {

      state.selectedDate =
        bookingDate.value;

      state.selectedTime = '';

      timeNext.disabled = true;

      loadSchedule();

    }
  );


  serviceNext.addEventListener(
    'click',
    function () {

      if (
        !state.selectedService ||
        !state.selectedDuration
      ) {
        return;
      }

      showScreen('screen-time');

      updateProgress(2);

      updateServiceSummary();

      state.selectedDate =
        bookingDate.value;

      loadSchedule();

    }
  );


  timeNext.addEventListener(
    'click',
    function () {

      if (
        !state.selectedDate ||
        !state.selectedTime
      ) {
        return;
      }

      prepareDetailsScreen();

      showScreen('screen-details');

      updateProgress(3);

    }
  );


  document
    .getElementById('back-to-service')
    .addEventListener(
      'click',
      function () {

        showScreen('screen-service');

        updateProgress(1);

      }
    );


  document
    .getElementById('back-to-time')
    .addEventListener(
      'click',
      function () {

        showScreen('screen-time');

        updateProgress(2);

      }
    );


  bookingForm.addEventListener(
    'submit',
    submitBooking
  );

}


/* =========================
   ЗАГРУЗКА УСЛУГ
========================= */

async function loadServices() {

  try {

    showLoading(
      servicesList,
      'Загрузка услуг...'
    );

    const response =
      await fetch(
        API_URL + '?action=getServices'
      );

    const data =
      await response.json();

    if (!data.success) {
      throw new Error(
        data.message ||
        'Не удалось загрузить услуги'
      );
    }

    state.services =
      data.services || [];

    state.additionalServices =
      data.additionalServices || [];

    renderServices();

    renderAdditionalServices();

  } catch (error) {

    showError(
      error.message ||
      'Ошибка загрузки услуг'
    );

    servicesList.innerHTML =
      '<div class="empty-state">' +
      'Не удалось загрузить услуги.<br>' +
      'Попробуйте открыть приложение ещё раз.' +
      '</div>';

  }

}


/* =========================
   ОСНОВНЫЕ УСЛУГИ
========================= */

function renderServices() {

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
        button.classList.add('selected');
      }


      button.innerHTML =
        '<div class="service-info">' +

          '<div class="service-name">' +
            escapeHtml(service.name) +
          '</div>' +

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


      servicesList.appendChild(button);

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

  renderAdditionalServices();

  renderDurations();

  durationSection.classList.remove(
    'hidden'
  );

  additionalSection.classList.remove(
    'hidden'
  );

  serviceNext.disabled = true;

}


/* =========================
   ДЛИТЕЛЬНОСТЬ
========================= */

function renderDurations() {

  const durationButtons =
    document.querySelectorAll(
      '.duration-card'
    );


  durationButtons.forEach(
    function (button) {

      const duration =
        Number(
          button.dataset.duration
        );


      const allowed =
        state.selectedService &&
        state.selectedService.durations &&
        state.selectedService.durations.includes(
          duration
        );


      if (!allowed) {

        button.disabled = true;

        button.classList.add(
          'disabled'
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


      button.onclick =
        function () {

          selectDuration(duration);

        };

    }
  );

}


/* =========================
   ВЫБОР ДЛИТЕЛЬНОСТИ
========================= */

function selectDuration(duration) {

  state.selectedDuration =
    duration;

  state.selectedTime =
    '';

  serviceNext.disabled =
    !state.selectedService ||
    !state.selectedDuration;


  renderDurations();

}


/* =========================
   ДОПОЛНИТЕЛЬНЫЕ УСЛУГИ
========================= */

function renderAdditionalServices() {

  additionalServicesList.innerHTML = '';

  if (!state.additionalServices.length) {
    return;
  }


  state.additionalServices.forEach(
    function (service) {

      const button =
        document.createElement('button');

      button.type = 'button';

      button.className =
        'additional-card';


      if (
        state.selectedAdditionalService &&
        state.selectedAdditionalService.name ===
        service.name
      ) {
        button.classList.add(
          'selected'
        );
      }


      button.innerHTML =
        '<div class="additional-info">' +

          '<div class="additional-name">' +
            escapeHtml(service.name) +
          '</div>' +

          '<div class="additional-subtitle">' +
            'Дополнительная услуга' +
          '</div>' +

        '</div>' +

        '<div class="additional-price">' +
          escapeHtml(
            service.price || '000 ₽'
          ) +
        '</div>' +

        '<div class="additional-check">' +
          '✓' +
        '</div>';


      button.addEventListener(
        'click',
        function () {

          toggleAdditionalService(
            service
          );

        }
      );


      additionalServicesList.appendChild(
        button
      );

    }
  );

}


/* =========================
   ВЫБОР ДОП. УСЛУГИ
========================= */

function toggleAdditionalService(
  service
) {

  if (
    state.selectedAdditionalService &&
    state.selectedAdditionalService.name ===
    service.name
  ) {

    state.selectedAdditionalService =
      null;

  } else {

    state.selectedAdditionalService =
      service;

  }


  renderAdditionalServices();

}


/* =========================
   РАСПИСАНИЕ
========================= */

async function loadSchedule() {

  if (
    !state.selectedDate ||
    !state.selectedDuration
  ) {

    timesList.innerHTML =
      '<div class="empty-state">' +
      'Выберите дату' +
      '</div>';

    return;

  }


  state.selectedTime = '';

  timeNext.disabled = true;


  timesList.innerHTML =
    '<div class="loading">' +
    'Загрузка свободного времени...' +
    '</div>';


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
      );


    const response =
      await fetch(url);


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

    timesList.innerHTML =
      '<div class="empty-state">' +
      'Не удалось загрузить время.<br>' +
      'Попробуйте выбрать дату ещё раз.' +
      '</div>';

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

  timesList.innerHTML = '';


  if (!times.length) {

    timesList.innerHTML =
      '<div class="empty-state">' +
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


      timesList.appendChild(button);

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


  timeNext.disabled =
    false;

}


/* =========================
   SUMMARY
========================= */

function updateServiceSummary() {

  if (!state.selectedService) {
    return;
  }


  document.getElementById(
    'selected-service-name'
  ).textContent =
    state.selectedService.name;


  let details =
    state.selectedDuration +
    ' ' +
    getHourWord(
      state.selectedDuration
    );


  if (state.selectedAdditionalService) {

    details +=
      ' · ' +
      state.selectedAdditionalService.name;

  }


  document.getElementById(
    'selected-service-details'
  ).textContent =
    details;

}


function prepareDetailsScreen() {

  document.getElementById(
    'summary-service'
  ).textContent =
    state.selectedService.name;


  document.getElementById(
    'summary-duration'
  ).textContent =
    state.selectedDuration +
    ' ' +
    getHourWord(
      state.selectedDuration
    );


  const additionalRow =
    document.getElementById(
      'summary-additional-row'
    );


  if (state.selectedAdditionalService) {

    document.getElementById(
      'summary-additional'
    ).textContent =
      state.selectedAdditionalService.name;

    additionalRow.classList.remove(
      'hidden'
    );

  } else {

    additionalRow.classList.add(
      'hidden'
    );

  }


  document.getElementById(
    'summary-date'
  ).textContent =
    formatDateForDisplay(
      state.selectedDate
    );


  document.getElementById(
    'summary-time'
  ).textContent =
    getTimeRange();

}


/* =========================
   ОТПРАВКА ЗАПИСИ
========================= */

async function submitBooking(
  event
) {

  event.preventDefault();


  const nameInput =
    document.getElementById('name');

  const phoneInput =
    document.getElementById('phone');


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


  bookingSubmit.disabled =
    true;

  bookingSubmit.textContent =
    'Создание записи...';


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
            JSON.stringify(payload)
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

    showError(
      error.message ||
      'Не удалось создать запись'
    );


    bookingSubmit.disabled =
      false;

    bookingSubmit.textContent =
      'Подтвердить запись';

  }

}


/* =========================
   УСПЕШНАЯ ЗАПИСЬ
========================= */

function showSuccess(data) {

  document.getElementById(
    'success-service'
  ).textContent =
    state.selectedService.name;


  document.getElementById(
    'success-date'
  ).textContent =
    formatDateForDisplay(
      state.selectedDate
    );


  document.getElementById(
    'success-time'
  ).textContent =
    getTimeRange();


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
   ВСПОМОГАТЕЛЬНОЕ
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
    Math.floor(minutes / 60);

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

  return number === 1
    ? 'час'
    : 'часа';

}


function showLoading(
  element,
  text
) {

  element.innerHTML =
    '<div class="loading">' +
    escapeHtml(text) +
    '</div>';

}


function showError(
  message
) {

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