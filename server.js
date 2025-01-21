const express = require('express');
const bcrypt = require('bcrypt'); // Importamos bcrypt para manejar contraseñas
const connectDB = require('./database');
const http = require('http');
const { User } = require('./models');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app); // Crear servidor HTTP
const PORT = 3000;
const io = new Server(server); // Configurar Socket.IO

var listaUsuarios = {};

app.use(express.json());
app.use(express.static('Paginas')); // Servir archivos estáticos
app.use(express.urlencoded({ extended: true }));

// Conectar a la base de datos
connectDB();

app.post('/addUser', async (req, res) => {
    try {
        const { nombre, password, email, fechaNacimiento } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ nombre, password: hashedPassword, email, fechaNacimiento });

        await newUser.save();
        res.status(201).send('Usuario añadido con éxito.');
    } catch (error) {
        res.status(500).send('Error al añadir el usuario: ' + error.message);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { nombre, password } = req.body;

        const usuario = await User.findOne({ nombre });
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado.');
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.password);
        if (!isPasswordValid) {
            return res.status(401).send('Contraseña incorrecta.');
        }

        res.status(200).send('Inicio de sesión exitoso.');
    } catch (error) {
        res.status(500).send('Error al procesar la solicitud: ' + error.message);
    }
});

// Ruta para validar los datos del usuario para recuperar contraseña
app.post('/valusurec', async (req, res) => {
    try {
        const { nombre, email, fechaNacimiento } = req.body;

        // Buscar al usuario en la base de datos
        const usuario = await User.findOne({ nombre });
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado.');
        }

        // Comparar el email
        if (email !== usuario.email) {
            return res.status(401).send('Correo electrónico incorrecto.');
        }

        // Comparar la fecha de nacimiento
        if (fechaNacimiento !== usuario.fechaNacimiento.toISOString().split('T')[0]) {
            return res.status(401).send('Fecha de nacimiento incorrecta.');
        }

        res.status(200).send('Datos validados correctamente. Procede a cambiar la contraseña.');
    } catch (error) {
        res.status(500).send('Error al procesar la solicitud: ' + error.message);
    }
});

// Ruta para cambiar la contraseña
app.post('/changePassword', async (req, res) => {
    try {
        const { nombre, email, fechaNacimiento, newPassword } = req.body;

        const usuario = await User.findOne({ nombre, email, fechaNacimiento });
        if (!usuario) {
            return res.status(404).send('Datos incorrectos. No se puede cambiar la contraseña.');
        }

        if (newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).send('La nueva contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        usuario.password = hashedPassword;
        await usuario.save();

        res.status(200).send('Contraseña cambiada con éxito.');
    } catch (error) {
        res.status(500).send('Error al cambiar la contraseña: ' + error.message);
    }
});

io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado:', socket.id);

    // Escuchar evento para registrar usuario
    socket.on('set user id', (userId) => {
        // Verificar si el usuario ya está conectado
        const usuarioExistente = Object.values(listaUsuarios).find(
            (usuario) => usuario.nombre === userId
        );

        if (usuarioExistente) {
            // Enviar mensaje al cliente rechazando la conexión
            socket.emit('user already connected', 'El usuario ya está conectado.');
            console.log(`Conexión rechazada: ${userId} ya está conectado.`);
            return;
        }

        // Registrar el usuario
        listaUsuarios[socket.id] = { nombre: userId, socketId: socket.id };
        console.log(`Usuario registrado: ${userId} con ID de socket: ${socket.id}`);

        // Notificar a todos los clientes sobre la actualización
        io.emit('update user list', listaUsuarios);
    });

    // Manejar mensajes públicos
    socket.on('chat message', (msg) => {
        const sender = listaUsuarios[socket.id]?.nombre || 'Anónimo';

        io.emit('chat message', { sender, msg });
    });
 
    // Manejar desconexión
    socket.on('disconnect', () => {
        const usuarioDesconectado = listaUsuarios[socket.id]?.nombre;
        console.log(`Usuario desconectado: ${usuarioDesconectado}`);
        delete listaUsuarios[socket.id];

        // Notificar a todos los clientes sobre la actualización
        io.emit('update user list', listaUsuarios);
    });
    
    // Escuchar mensajes privados del cliente y mandarlos a su recepto
    socket.on('private message', ({ destinatario, message }) => {
        console.log(destinatario);
        io.to(destinatario).emit('private message', { emisor: listaUsuarios[socket.id]?.nombre, message });
    });
});



// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/index.html'));
});

// Páginas de Sesión
app.get('/Registrar', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/Registrar.html'));
});
app.get('/Login', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/Login.html'));
});

//Paginas de Recuperacion
app.get('/Recover', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/Recuperar.html'));
});
app.get('/ChangePassword', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/CambioPass.html'));
});

//Pagina de Chat
app.get('/Chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'Paginas/Chat.html'));
});

// Iniciar el servidor
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
