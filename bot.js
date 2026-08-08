require('dotenv').config();
const { TelegramBot } = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Бот запущен!');

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(
        chatId,
        `Привет, ${msg.from.first_name}! 🌙

Добро пожаловать.

Здесь можно записаться на массаж.`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '💆 Записаться на массаж',
                            callback_data: 'booking'
                        }
                    ]
                ]
            }
        }
    );
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'booking') {
        bot.answerCallbackQuery(query.id);

        bot.sendMessage(
            chatId,
            'Сейчас откроем запись на массаж ✨'
        );
    }
});