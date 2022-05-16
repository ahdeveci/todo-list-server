module.exports = {
    api_secret_key: "TODO APP DEVELOPED BY DEVECI",
    dbConfig : {
        host     : process.env.DB_HOST || process.env.MYSQLDB_HOST || '127.0.0.1',
        user     : process.env.DB_USER ||  process.env.MYSQLDB_USER || 'root',
        password : process.env.DB_PASSWORD || process.env.MYSQLDB_ROOT_PASSWORD || '',
      //  database : process.env.DB_NAME || 'todolist3',
    },
    database: process.env.DB_NAME || process.env.MYSQLDB_DATABASE || 'todolist',
}
