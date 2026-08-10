const { createClient } = require('@libsql/client');

/**
 * Cliente SQLite remoto (Turso / libSQL).
 * Os dados ficam na cloud — sobrevivem a restarts do Render Free.
 */
function criarClienteLibsql() {
    const url = (
        process.env.TURSO_DATABASE_URL ||
        process.env.LIBSQL_URL ||
        process.env.LIBSQL_DATABASE_URL ||
        ''
    ).trim();
    const authToken = (
        process.env.TURSO_AUTH_TOKEN ||
        process.env.LIBSQL_AUTH_TOKEN ||
        ''
    ).trim();

    if (!url) return null;
    if (url.startsWith('file:') || url.startsWith('libsql:') || url.startsWith('https:')) {
        return createClient({
            url,
            authToken: authToken || undefined
        });
    }
    return null;
}

function temBaseRemota() {
    return !!(
        process.env.TURSO_DATABASE_URL ||
        process.env.LIBSQL_URL ||
        process.env.LIBSQL_DATABASE_URL
    );
}

module.exports = {
    criarClienteLibsql,
    temBaseRemota
};
