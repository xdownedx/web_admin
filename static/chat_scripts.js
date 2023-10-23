document.addEventListener('DOMContentLoaded', function() {
    let selectedUser = null;

    // Загрузка данных из JSON
    async function fetchData() {
        try {
            // Изменим URL на ваш API-эндпоинт
            const response = await fetch('http://malone_millionaire_app:4080/api/v1/all_users');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data.map(user => ({
                id: user.id,
                name: user.username,
                firstname: user.firstname,
                is_admin: user.is_admin,
                bot_state: user.bot_state,
                lives: user.lives,
                state: user.step,
                last_time_message: user.lats_action_time,
                messages: JSON.parse(user.dialog_history).map(msg => ({
                    from: msg.from,
                    text: msg.message,
                    media: null,
                    timestamp: msg.timestamp
                }))
            }));
        } catch (error) {
            console.error('There was a problem fetching the data:', error);
        }
    }

    // Функция для отображения модального окна
    function showUserInfo(user) {
        const modal = document.getElementById('userModal');
        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
            <strong>ID:</strong> ${user.id}<br>
            <strong>Username:</strong> ${user.name}<br>
            <strong>Имя:</strong> ${user.firstname}<br>
            <strong>Админ:</strong> ${user.is_admin ? 'Yes' : 'No'}<br>
            <strong>Текущий этап:</strong> ${user.state}<br>
            <strong>Жизни:</strong> ${user.lives}
        `;
        modal.style.display = 'block';
    }


    // Закрытие модального окна
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('userModal').style.display = 'none';
    });

    // Добавление пользователей в список
     function addUserToList(user) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'user-item');
        listItem.dataset.id = user.id;

        // Имя пользователя или его ID, если username пуст
        const displayName = user.name || user.id.toString();
        const usernameSpan = document.createElement('span');
        usernameSpan.textContent = displayName;


        // Текст последнего сообщения и время
        const lastMessage = user.messages[user.messages.length - 1];
        const lastMessageSpan = document.createElement('span');
        lastMessageSpan.classList.add('user-last-message');
        lastMessageSpan.innerHTML = `${lastMessage.text} <span class="user-timestamp">${new Date(lastMessage.timestamp).toLocaleTimeString()}</span>`;

        listItem.appendChild(usernameSpan);
        listItem.appendChild(lastMessageSpan);

        listItem.addEventListener('click', function() {
            document.querySelectorAll('#user-list li').forEach(li => li.classList.remove('selected'));
            // Добавление класса 'selected' к выбранному элементу
            listItem.classList.add('selected');

            selectedUser = user.id;
            document.querySelectorAll('#user-list li').forEach(li => li.classList.remove('active'));
            listItem.classList.add('active');
            loadChat(selectedUser);
            scrollToBottom();
        });
        if (user.messages[user.messages.length - 1].from !== "admin" && !listItem.classList.contains('active')) {
            listItem.style.fontWeight = 'bold'; // или любой другой способ выделения
        }

        document.getElementById('user-list').appendChild(listItem);
        document.getElementById('user-list').appendChild(listItem);
        if (selectedUser === user.id) {
            listItem.classList.add('selected');
        }
    }

    // Загрузка чата
    function loadChat(userId) {
        const chatArea = document.getElementById('chat-area');
        chatArea.innerHTML = ''; // очистка предыдущих сообщений
        const user = users.find(u => u.id === userId);
        user.messages.forEach(message => {
            const position = message.from;
            const mediaContent = message.media ? `<a href="${message.media}" target="_blank"><img src="${message.media}"></a>` : '';
            const timestampSpan = `<span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>`;
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', position);
            messageDiv.innerHTML = `${message.text}${mediaContent}${timestampSpan}`;
            chatArea.appendChild(messageDiv);
        });
        const userObj = users.find(u => u.id === userId);
        const displayName = user.name || user.id.toString();
        const usernameLink = `<a href="#" id="usernameLink">@${displayName}</a>`;
        document.getElementById('chat-title').innerHTML = `Чат с ${usernameLink}`;

        document.getElementById('chat-title').innerHTML = `Чат с ${usernameLink}`;

        // Изменение обработчика событий для ссылки username
        document.getElementById('usernameLink').addEventListener('click', function(event) {
            event.preventDefault();
            showUserInfo(userObj);
        });
    }
    // Отправка сообщения
    function sendMessage() {
        const textArea = document.getElementById('message-input');
        const text = textArea.value;
        if (text) {
            const user = users.find(u => u.id === selectedUser);
            user.messages.push({ from: "admin", text: text, media: null, timestamp: new Date().toISOString() });
            loadChat(selectedUser);

            // Здесь мы используем текущий домен и добавляем к нему /proxy/
            const proxyURL = window.location.origin + '/proxy/';

            fetch(proxyURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: selectedUser,
                    text: text
                })
            }).then(response => {
                console.log(response)
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to send message');
                }
            });

            textArea.value = '';
            scrollToBottom();
        }
    }


    document.getElementById('send-button').addEventListener('click', sendMessage);

    // Отправка сообщения по нажатию на Enter
    document.getElementById('message-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Прокрутка вниз
    function scrollToBottom() {
        const chatArea = document.getElementById('chat-area');
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // Drag and Drop для изображений
    function dropHandler(event) {
        event.preventDefault();
        if (event.dataTransfer.items) {
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
                if (event.dataTransfer.items[i].kind === 'file') {
                    const file = event.dataTransfer.items[i].getAsFile();
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const user = users.find(u => u.id === selectedUser);
                        user.messages.push({ from: "admin", text: "", media: e.target.result, timestamp: new Date().toISOString() });
                        loadChat(selectedUser);
                        scrollToBottom();
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    }

    function dragOverHandler(event) {
        event.preventDefault();
    }
    async function checkForNewMessages() {
        const newData = await fetchData();
        // Проверка наличия изменений в данных
        if (JSON.stringify(newData) !== JSON.stringify(users)) {
            // Обновить глобальные данные
            users = newData;
            // Очистить список пользователей и добавить их заново
            document.getElementById('user-list').innerHTML = '';
            users.sort((a, b) => new Date(b.messages[b.messages.length - 1].timestamp) - new Date(a.messages[a.messages.length - 1].timestamp)).forEach(addUserToList);

            // Если текущий пользователь выбран, обновите его чат
            if (selectedUser) {
                const user = users.find(u => u.id === selectedUser);
                if (user.messages.length !== document.querySelectorAll('#chat-area .message').length) {
                    loadChat(selectedUser);
                    scrollToBottom();
                }
            }
        }
    }


    document.getElementById('chat-area').addEventListener('drop', dropHandler);
    document.getElementById('chat-area').addEventListener('dragover', dragOverHandler);
    setInterval(checkForNewMessages, 1000);

    // Инициализация
    fetchData().then(fetchedUsers => {
        users = fetchedUsers; // Присваиваем загруженные данные переменной users
        users.sort((a, b) => new Date(b.messages[b.messages.length - 1].timestamp) - new Date(a.messages[a.messages.length - 1].timestamp));
        users.forEach(addUserToList);
    });
});