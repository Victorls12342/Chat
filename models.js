const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return v.includes('@');
            },
            message: props => `${props.value} no es un correo válido.`
        }
    },
    password: { 
        type: String, 
        required: true,
        validate: {
            validator: function (v) {
                const errors = [];
                if (v.length < 6) errors.push('al menos 6 caracteres');
                if (!/[A-Z]/.test(v)) errors.push('una letra mayúscula');
                if (!/[a-z]/.test(v)) errors.push('una letra minúscula');
                if (!/[0-9]/.test(v)) errors.push('un número');
                if (errors.length > 0) throw new Error(`La contraseña debe contener: ${errors.join(', ')}.`);
                return true;
            },
            message: props => props.message
        }
    },
    fechaNacimiento: { 
        type: Date, 
        required: true 
    }
});

const User = mongoose.model('User', UserSchema, "TabaUsers");
module.exports = { User };
