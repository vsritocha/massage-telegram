/* =========================================================
   TELEGRAM MINI APP
========================================================= */

/*
   Когда приложение будет открываться ВНУТРИ Telegram,
   Telegram.WebApp будет доступен.

   Пока мы тестируем через обычный браузер,
   его может не быть — поэтому проверяем.
*/


const tg = window.Telegram
    ? window.Telegram.WebApp
    : null;


/* Если мы действительно внутри Telegram */

if (tg) {

    tg.ready();

    tg.expand();

}


/* =========================================================
   ЭЛЕМЕНТЫ СТРАНИЦЫ
========================================================= */

const bookingButton =
    document.getElementById('booking-button');

const success =
    document.getElementById('success');

const bookingCard =
    document.querySelector('.booking-card');


/* =========================================================
   КНОПКА «ЗАПИСАТЬСЯ»
========================================================= */

bookingButton.addEventListener(
    'click',
    function () {

        /* Получаем данные формы */

        const service =
            document.getElementById('service').value;

        const date =
            document.getElementById('date').value;

        const time =
            document.getElementById('time').value;

        const name =
            document.getElementById('name').value;

        const phone =
            document.getElementById('phone').value;


        /* =================================================
           ПРОВЕРКА
        ================================================= */

        if (!service) {

            alert('Выберите услугу');

            return;

        }


        if (!date) {

            alert('Выберите дату');

            return;

        }


        if (!time) {

            alert('Выберите время');

            return;

        }


        if (!name) {

            alert('Введите имя');

            return;

        }


        if (!phone) {

            alert('Введите телефон');

            return;

        }


        /* =================================================
           ПОКА ПРОСТО ПОКАЗЫВАЕМ УСПЕШНУЮ ЗАПИСЬ

           Позже здесь будет отправка данных в DIKIDI.
        ================================================= */

        bookingCard.style.display =
            'none';

        success.style.display =
            'block';


        /* =================================================
           ПОКА В КОНСОЛЬ

           Позже эти данные отправятся
           на наш сервер → DIKIDI.
        ================================================= */

        console.log({

            service: service,

            date: date,

            time: time,

            name: name,

            phone: phone

        });


        /* =================================================
           TELEGRAM

           Позже здесь можно будет отправить
           данные обратно боту.

           Пока оставляем это выключенным.
        ================================================= */

        /*
        if (tg) {

            tg.sendData(
                JSON.stringify({
                    service,
                    date,
                    time,
                    name,
                    phone
                })
            );

        }
        */

    }
);