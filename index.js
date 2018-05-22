const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');

const Bot = require('./bot');
const JsonDB = require('./jsondb')
const Content = require('./content')

const token = '578563568:AAGzZqbPUtX49Q8GPXzOYmefQ_v9pk0xw7U';


const bot = new TelegramBot(token, { polling: true });
const db = new JsonDB('db.json');

const comands = ['/start', '/savedb', '/uploaddb', '/article', '/stat'];

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'telegrampride@gmail.com',
        pass: 'pridebot2017'
    }
});

const mailOptions = {
    from: 'telegrampride@gmail.com',
    to: 'user75202666+jtps3k3iv8351fo93xep@boards.trello.com',
};

async function sendDefaultContent(user) {
    const content = new Content(user);
    // const ikb = Bot.inlineKeyboard([
    //     [{ text: content.actionMsg, callback_data: "CREATE_ORDER" }]
    // ]);
    // let kb = Bot.hideKeyboard()
    // for (let idx = 0; idx < content.initialContent.length; idx++) {
    //     const message = content.initialContent[idx];
    //     const res = await bot.sendMessage(user.chatId, message,
    //         (idx == content.initialContent.length - 1) ? ikb : kb);
    // }
    const prevTask = db.get('task', item => item.user == user.id)
    if (prevTask) db.delete('task', prevTask.id);

    db.create('task', { user: user.id, type: 'order', request: content.orderData[0].id, info: {} });
    let kb = Bot.hideKeyboard();
    if (content.orderData[0].id == 'phone')
        kb = Bot.keyboard([[{ text: 'Отправить номер телефона', request_contact: true }]]);
    if (content.orderData[0].kb)
        kb = Bot.keyboard(content.orderData[0].kb);
    bot.sendMessage(user.chatId, content.orderData[0].title, kb)
}

function applyOrder(task, user) {
    const subjects = {
        'plan_setup': '#telegram',
        'plan_work': '#telegram_partners',
        'alredy_setup': '#telegram_TO',
    }
    const translates = {
        'name': 'Ваше имя:',
        'car': 'Марка и модель автомобиля:',
        'year': 'Год выпуска:',
        'engine': 'Объем двигателя:',
        'phone': 'Номер телефона:',
        'area': 'Род деятельности:',
        'city': 'Город:'
    }
    const subject = subjects[user.type];
    let text = '';
    for (let key in task.info) {
        if (task.info.hasOwnProperty(key)) {
            text += `${translates[key]} ${task.info[key]}\n`;
        }
    }
    let mOptions = Object.assign({ subject, text }, mailOptions);

    transporter.sendMail(mOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            bot.sendMessage(user.chatId, Content.orderCreatedMsg, Bot.hideKeyboard())
            db.delete('task', task.id);
            db.update('user', user.id, {
                order_qty: user.order_qty + 1
            })
        }
    });

}

bot.onText(/\/start/, (msg, match) => {

    let user = db.get('user', (item) => item.userId == msg.from.id);
    if (!user) {
        const keyboard = Content.userTypes.map(t => [t.name])
        bot.sendMessage(msg.chat.id, Content.helloMsg, Bot.keyboard(keyboard));
    } else sendDefaultContent(user);
});

bot.onText(/\/savedb/, (msg, match) => {
    let user = db.get('user', (item) => item.userId == msg.from.id);
    if (!user || !user.admin) return;
    bot.sendDocument(user.chatId, './db.json')
});

bot.onText(/\/setadmin/, (msg, match) => {
    let user = db.get('user', (item) => item.userId == msg.from.id);
    if (!user || !user.admin) return;
    db.create('task', { type: 'setadmin', user: user.id })
    bot.sendMessage(msg.chat.id, 'Chatid:', Bot.keyboard([['Отмена']]))
});

bot.onText(/\/stat/, (msg, match) => {
    let user = db.get('user', (item) => item.userId == msg.from.id);
    if (!user || !user.admin) return;
    const users = db.list('user');
    const oUsers = users.filter(u => u.order_qty > 0)
    const text = `Количество пользователей - ${users.length}\nКоличество пользователей сделавшых заказ - ${oUsers.length}`;
    bot.sendMessage(msg.chat.id, text, Bot.hideKeyboard());
});



bot.onText(/\/article/, (msg, match) => {
    let user = db.get('user', (item) => item.userId == msg.from.id);
    if (!user || !user.admin) return;
    const prevTask = db.get('task', item => item.user == user.id)
    if (prevTask) db.delete('task', prevTask.id);

    db.create('task', { user: user.id, type: 'article', request: 'text', info: {} });
    bot.sendMessage(msg.chat.id, 'Отправте материалы для публикации', Bot.hideKeyboard());
});

bot.on('callback_query', function (msg) {
    const user = db.get('user', (item) => item.chatId == msg.message.chat.id);
    if (!user) return;
    const content = new Content(user);

    switch (true) {
        case (msg.data == 'CREATE_ORDER'): {
            const prevTask = db.get('task', item => item.user == user.id)
            if (prevTask) db.delete('task', prevTask.id);

            db.create('task', { user: user.id, type: 'order', request: content.orderData[0].id, info: {} });
            let kb = Bot.hideKeyboard();
            if (content.orderData[0].id == 'phone')
                kb = Bot.keyboard([[{ text: 'Отправить номер телефона', request_contact: true }]]);
            if (content.orderData[0].kb)
                kb = Bot.keyboard(content.orderData[0].kb);
            bot.sendMessage(msg.message.chat.id, content.orderData[0].title, kb)
            break;
        }
        // case (msg.data.includes('DENY')): {
        //     if (!user.admin) return;
        //     try {
        //         const id = parseInt(msg.data.split('_')[0]);
        //         const task = db.get('task', (item) => item.id == id);
        //         if (!task) return;
        //         db.delete('task', id);
        //         const user = db.get('user', (item) => item.id == task.user);
        //         if (!user) return;
        //         bot.sendMessage(task.chatId, Content.managerNotFoundMsg);
        //     } catch (e) {
        //         console.log(e);
        //     }
        // }
        // case (msg.data.includes('CONNECT')): {
        //     if (!user.admin) return;
        //     try {
        //         const id = parseInt(msg.data.split('_')[0]);
        //         const task = db.get('task', (item) => item.id == id);
        //         if (!task) return;
        //         db.delete('task', id);
        //         const u = db.get('user', (item) => item.id == task.user);
        //         if (!u) return;
        //         db.create('connection', {
        //             admin: user.id,
        //             user: u.id
        //         })
        //         bot.sendMessage(msg.message.chat.id, "Соеденено", Bot.keyboard([['Стоп']]))
        //     } catch (e) {
        //         console.log(e);
        //     }
        // }
    }
});

bot.on('message', (msg) => {
    if (comands.includes(msg.text)) return;
    if (!msg.text) return;
    const user = db.get('user', (item) => item.chatId == msg.chat.id);
    if (!user) {
        const userType = Content.userTypes.find(t => t.name == msg.text);
        if (!userType) {
            const keyboard = Content.userTypes.map(t => [t.name])
            bot.sendMessage(msg.chat.id, Content.repeatHelloMsg, Bot.keyboard(keyboard));
            return;
        }
        const newUser = {
            userId: msg.from.id,
            chatId: msg.chat.id,
            type: userType.id,
            order_qty: 0,
            name: msg.from.first_name,
            lastName: msg.from.last_name
        };
        db.create('user', newUser);
        sendDefaultContent(newUser);
        return;
    };
    const content = new Content(user);
    const task = db.get('task', (item) => item.user == user.id);
    const connection = db.get('connection', (item) => item.user == user.id || item.admin == user.id);

    switch (true) {
        // case (!!connection): {
        //     if (user.admin && msg.text == 'Стоп') {
        //         db.delete('connection', connection.id);
        //         break;
        //     }
        //     const opositeId = (user.admin) ? connection.user : connection.admin;
        //     const opositeUser = db.get('user', (item) => item.id == opositeId);
        //     bot.sendMessage(opositeUser.chatId, msg.text);
        //     break;
        // }
        // case (!task && !user.admin): {
        //     db.create('task', { user: user.id, chatId: msg.chat.id, type: 'connect', message: msg.text });

        //     const keyboard = [['Да', 'Нет']];
        //     bot.sendMessage(msg.chat.id, Content.connectMsg, Bot.keyboard(keyboard))
        //     break;
        // }
        // case (task && task.type == 'connect' && task.status != 'acepted'): {
        //     if (msg.text == 'Нет') {
        //         db.delete('task', task.id);
        //         bot.sendMessage(msg.chat.id, 'Отменено', Bot.hideKeyboard());
        //         return;
        //     };
        //     if (msg.text == 'Да') {
        //         db.update('task', task.id, {
        //             status: 'acepted'
        //         })
        //         bot.sendMessage(msg.chat.id, Content.waitMsg, Bot.hideKeyboard())
        //         const type = Content.userTypes.find(t => t.id == user.type);
        //         admins = db.list('user', (item) => item.admin);
        //         admins.forEach(admin => {
        //             const kb = [[{ text: "Соеденить", callback_data: `${task.id}_CONNECT` },
        //             { text: "Отказать", callback_data: `${task.id}_DENY` }]]
        //             bot.sendMessage(admin.chatId, `Запрос на соеденение с менеджером:\nИмя - ${msg.from.first_name}\nCтатус - ${type.name}\nСообщение - ${task.message}\n`,
        //                 Bot.inlineKeyboard(kb))
        //         })
        //     }
        //     break;
        // }
        case (task && task.type == 'order' && !!task.request): {
            task.info[task.request] = msg.text;
            const currentRequest = content.orderData.find(d => d.id == task.request);
            if (!currentRequest) return;
            if (!currentRequest.next) {
                return applyOrder(task, user);
            }
            const nextRequest = content.orderData.find(d => d.id == currentRequest.next);
            db.update('task', task.id, {
                request: nextRequest.id,
                info: task.info
            });
            let kb = Bot.hideKeyboard();
            if (nextRequest.id == 'phone')
                kb = Bot.keyboard([[{ text: 'Отправить номер телефона', request_contact: true }]]);
            if (nextRequest.kb)
                kb = Bot.keyboard(nextRequest.kb);
            bot.sendMessage(msg.chat.id, nextRequest.title, kb);
            break;
        }
        case (task && task.type == 'setadmin'): {
            if (msg.text == 'Отмена') {
                db.delete('task', task.id);
                bot.sendMessage(msg.chat.id, 'Отменено', Bot.hideKeyboard());
                return;
            }
            const updateUser = db.get('user', (user) => user.chatId == msg.text);
            if (!updateUser) {
                bot.sendMessage(msg.chat.id, 'Chatid:', Bot.keyboard([['Отмена']]));
                return;
            }
            db.update('user', updateUser.id, {
                admin: !updateUser.admin
            })
            bot.sendMessage(msg.chat.id, `Админ статус пользователя ${updateUser.name} - ${!updateUser.admin}`, Bot.hideKeyboard());
        }
        case (task && task.type == 'article' && !!task.request && !!user.admin): {
            if (msg.text == 'Отмена') {
                db.delete('task', task.id);
                bot.sendMessage(msg.chat.id, 'Отменено', Bot.hideKeyboard());
                return;
            }
            if (task.request == 'text') {
                task.info[task.request] = msg.text;
                db.update('task', task.id, {
                    request: 'target',
                    info: task.info
                });
                const kb = [['Все']].concat(Content.userTypes.map(t => [t.name]), [['Отмена']])
                bot.sendMessage(msg.chat.id, 'Укажите статус пользователей, для которых создается публикация:', Bot.keyboard(kb));
                return;
            }
            if (task.request == 'target') {
                let target = [];
                if (msg.text == 'Все') target = Content.userTypes.map(t => t.id);
                else {
                    const type = Content.userTypes.find(t => t.name == msg.text);
                    if (!!type) target = [type.id];
                }
                if (!target.length) {
                    const kb = [['Все']].concat(Content.userTypes.map(t => [t.name]), [['Отмена']])
                    bot.sendMessage(msg.chat.id, 'Укажите статус пользователей, для которых создается публикация:', Bot.keyboard(kb));
                    return;
                }
                task.info[task.request] = msg.text;
                task.info['targetList'] = target;
                db.update('task', task.id, {
                    request: 'confirm',
                    info: task.info
                });
                const keyboard = [['Да', 'Нет']];
                bot.sendMessage(msg.chat.id, `Вы уверены что хотите отправить эти материали групе: ${msg.text}`, Bot.keyboard(keyboard))
                return;
            }
            if (task.request == 'confirm') {
                if (msg.text == 'Нет') {
                    db.delete('task', task.id);
                    bot.sendMessage(msg.chat.id, 'Отменено', Bot.hideKeyboard());
                    return;
                };
                if (msg.text == 'Да') {
                    bot.sendMessage(msg.chat.id, 'Опубликовано', Bot.hideKeyboard());
                    const users = db.list('user', (item) => task.info.targetList.includes(item.type));
                    const ikb = Bot.inlineKeyboard([
                        [{ text: content.actionMsg, callback_data: "CREATE_ORDER" }]
                    ]);
                    users.forEach(user => {
                        bot.sendMessage(user.chatId, task.info.text, ikb)
                    })
                    db.delete('task', task.id);
                    return;
                }
                const keyboard = [['Да', 'Нет']];
                bot.sendMessage(msg.chat.id, `Вы уверены что хотите отправить эти материали групе: ${task.info['target']}`, Bot.keyboard(keyboard))
            }
            break;
        }
    }
});

bot.on("contact", (msg) => {
    const user = db.get('user', (item) => item.chatId == msg.chat.id);
    if (!user) return;
    const content = new Content(user);
    const task = db.get('task', (item) => item.user == user.id);
    switch (true) {
        case (task && task.type == 'order' && !!task.request): {
            task.info[task.request] = msg.contact.phone_number;
            const currentRequest = content.orderData.find(d => d.id == task.request);
            if (!currentRequest) return;
            if (!currentRequest.next) {
                return applyOrder(task, user);
            }
            const nextRequest = content.orderData.find(d => d.id == currentRequest.next);
            db.update('task', task.id, {
                request: nextRequest.id,
                info: task.info
            });
            let kb = Bot.hideKeyboard();
            if (nextRequest.id == 'phone')
                kb = Bot.keyboard([[{ text: 'Отправить номер телефона', request_contact: true }]]);
            if (nextRequest.kb)
                kb = Bot.keyboard(nextRequest.kb);
            bot.sendMessage(msg.chat.id, nextRequest.title, kb)
            break;
        }
    }
})
