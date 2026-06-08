// API no mesmo servidor quando abre http://localhost:3000
(function () {
    const origin = window.location.origin;
    const port = window.location.port;

    if (port === '3000' || (port === '' && origin.includes('localhost'))) {
        window.API_URL = origin + '/api';
    } else {
        window.API_URL = 'http://localhost:3000/api';
    }

    var API_URL = window.API_URL;
})();
