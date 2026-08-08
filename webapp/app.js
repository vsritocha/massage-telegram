/* =========================================================
   TELEGRAM MINI APP
========================================================= */

const tg = window.Telegram
    ? window.Telegram.WebApp
    : null;


/* =========================================================
   TELEGRAM
========================================================= */

if (tg) {

    tg.ready();

    tg.expand();

}


/* =========================================================
   DIKIDI
========================================================= */

const DIKIDI_URL =
    'https://dikidi.net/#widget=215048';


/* =========================================================
   КНОПКА «ЗАПИСАТЬСЯ»
========================================================= */

const bookingButton =
    document.getElementById('booking-button');


if (bookingButton) {

    bookingButton.addEventListener(
        'click',
        function () {

            window.location.href = DIKIDI_URL;

        }
    );

}


/* =========================================================
   ЗАЩИТА ОТ ОШИБОК
========================================================= */

window.addEventListener(
    'error',
    function (event) {

        console.error(
            'Ошибка приложения:',
            event.error || event.message
        );

    }
);