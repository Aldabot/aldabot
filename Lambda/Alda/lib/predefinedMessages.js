import Promise from 'bluebird';
import {
    respondTextMessage,
    respondTextQuickReplies,
    respondWebUrlButtons
} from './messenger.js';

export const sendWelcomeMessages = (psid) => {
    let promises = [
        respondTextMessage(
            psid,
            'Hola, soy Alda. Estoy aquí para simplificar la administración de tu dinero.',
        ),
        respondTextMessage(
            psid,
            'Puedes pensar en mí como tu asistente personal.'
        ),
        respondTextQuickReplies(
            psid,
            'Lo ayudaré a hacer un seguimiento de lo que está gastando, cómo está gastando y cómo puede hacerlo mejor.',
            [{title: 'Empecemos', payload: "START_LOGIN"}]
        )
    ];
    return Promise.each(promises, (promise) => {
        return promise();
    });
};

export const sendFirstLoginMessages = (psid) => {
    let promises = [
        respondTextMessage(
            psid,
            '¡Guay! Para comenzar su viaje hacia una mejor administración del dinero, necesito vincularme con su banca en línea.',
            'RESPONSE'
        ),
        respondWebUrlButtons(
            psid,
            "Sus detalles están protegidos por seguridad de nivel bancario. Están completamente protegidos y son 100% seguros.",
            [
                {
                    title: "Claro 🔒",
                    url: "https://aldabot.es/#/registrate"
                }
            ]
        )
    ];
    return Promise.each(promises, (promise) => {
        return promise();
    });
};
