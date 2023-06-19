const sqlite3 = require('sqlite3').verbose();

// Connect to the `contacts.db` database if exists. If not, create the db file...
const db = new sqlite3.Database('./databases/contacts.db', (err) => {
    if(err){
        throw err;
    }
    
    console.log(`Connected to the CONTACTS database!`)
})