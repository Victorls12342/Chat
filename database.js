const mongoose = require('mongoose');

// Cadena de conexión a MongoDB
const MONGO_URI = 'mongodb+srv://vls0004:Victor.2017@cluster0.nyr0o.mongodb.net/Chat';

// Crear una constante que almacenará la promesa de conexión
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conexión exitosa a MongoDB');
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        // Si quieres lanzar el error para manejarlo en otro lugar, puedes descomentarlo
        // throw error;
    }
};
// Exportar mongoose para que pueda ser reutilizado en otros archivos
module.exports = connectDB;
