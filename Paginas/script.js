document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const storedName = localStorage.getItem('nombre');

    let currentRecipient = 'public'; // Destinatario actual (público o ID de usuario)
    let activeButton = null; // Referencia al botón actualmente activo

    // Enviar el nombre al servidor al conectar
    socket.emit('set user id', storedName);

    // Escuchar si el usuario ya está conectado
    socket.on('user already connected', (message) => {
        alert(message); // Mostrar alerta al usuario
        window.location.href = '/Login'; // Redirigir al formulario de inicio de sesión
    });

    // Manejar el botón de salida
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    // Función para actualizar el botón activo
    function setActiveButton(button) {
        if (activeButton) {
            activeButton.classList.remove('active-button'); // Quitar estilo del botón previamente activo
        }
        button.classList.add('active-button'); // Agregar estilo al botón actual
        activeButton = button;
    }

    // Mostrar lista de usuarios conectados
    const chatButtonsContainer = document.getElementById('chat-buttons');
    socket.on('update user list', (users) => {
        chatButtonsContainer.innerHTML = '';

        // Botón de chat público
        const publicButton = document.createElement('button');
        publicButton.className = 'btn btn-secondary btn-block';
        publicButton.textContent = 'Chat Público';
        publicButton.dataset.chat = 'public';
        publicButton.addEventListener('click', () => {
            currentRecipient = 'public';
            setActiveButton(publicButton);
            document.getElementById('input').placeholder = 'Escribe un mensaje para el Chat Público';
        });
        chatButtonsContainer.appendChild(publicButton);

        // Botones para usuarios conectados
        for (const id in users) {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-primary btn-block';
            button.textContent = `Chat con ${users[id].nombre}`;
            button.dataset.chat = id;

            // Evento para cambiar al chat privado
            button.addEventListener('click', () => {
                currentRecipient = id;
                setActiveButton(button);
                document.getElementById('input').placeholder = `Escribe un mensaje privado para ${users[id].nombre}`;
                document.getElementById('input').dataset.recipientName = users[id].nombre;
            });
            chatButtonsContainer.appendChild(button);
        }

        // Marcar el botón de "Chat Público" como activo por defecto
        setActiveButton(publicButton);
    });

    // Manejar envío de mensajes
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const destinatario = currentRecipient;
        const message = input.value;

        if (message) {
            if (destinatario === 'public') {
                socket.emit('chat message', message); // Enviar mensaje público

                // Mostrar mensaje público enviado
                const item = document.createElement('div');
                item.className = 'message message-sent';
                item.innerHTML = `<strong style="color: blue;">Para Chat Público:</strong> ${message}`;
                messages.appendChild(item);
            } else {
                const recipientName = input.dataset.recipientName || 'desconocido';
                socket.emit('private message', { destinatario, message }); // Enviar mensaje privado

                // Mostrar mensaje privado enviado
                const item = document.createElement('div');
                item.className = 'message message-sent';
                item.innerHTML = `<strong style="color: blue;">Para ${recipientName}:</strong> ${message}`;
                messages.appendChild(item);
            }

            messages.scrollTop = messages.scrollHeight;
            input.value = ''; // Limpiar el campo de entrada
        }
    });

    // Escuchar mensajes públicos
    socket.on('chat message', (msg) => {
        const item = document.createElement('div');
        item.className = 'message message-received';
        item.textContent = msg;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });

    // Escuchar mensajes privados
    socket.on('private message', ({ emisor, message }) => {
        const item = document.createElement('div');
        item.className = 'message message-received';
        item.innerHTML = `<strong style="color: red;">Privado de ${emisor}:</strong> ${message}`;
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    });
});
