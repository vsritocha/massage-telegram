const express = require('express');
const path = require('path');

const app = express();

const PORT =
  process.env.PORT || 3000;


/* =========================
   MIDDLEWARE
========================= */

app.use(
  express.static(
    path.join(__dirname)
  )
);


/* =========================
   ГЛАВНАЯ
========================= */

app.get(
  '/',
  function (req, res) {

    res.sendFile(
      path.join(
        __dirname,
        'index.html'
      )
    );

  }
);


/* =========================
   HEALTH CHECK
========================= */

app.get(
  '/health',
  function (req, res) {

    res.json({
      success: true,
      message: 'Massage Mini App работает'
    });

  }
);


/* =========================
   SERVER
========================= */

app.listen(
  PORT,
  function () {

    console.log(
      'Server started on port ' +
      PORT
    );

  }
);