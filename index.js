const sqlite3 = require('sqlite3').verbose();

// Connect to the `contacts.db` database if exists. If not, create the db file...
const db = new sqlite3.Database('./databases/contacts.db', (err) => {
    if(err){
        throw err;
    }
    
    console.log(`Connected to the CONTACTS database!`);

    // createTable();
    // createNewContact("123456", "testing@gmail.com", "primary")
    // getAllContacts()
    // clearTable();
})


// Relevant SQL basic functions
// ------------------------------------------------------
function createTable(){
    let command = `
        CREATE TABLE Contact(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phoneNumber VARCHAR(20),
            email VARCHAR(60),
            linkedId INTEGER,
            linkPrecedence VARCHAR(10) CHECK (linkPrecedence IN ("primary", "secondary")) NOT NULL,
            createdAt VARCHAR(50) NOT NULL,
            updatedAt VARCHAR(50) NOT NULL,
            deletedAt VARCHAR(50)
        )
    `

    db.exec(command, (err) => {
        if(err){
            throw err;
        }

        console.log(`Created table Contact!`);
    })
}

// Function to create new contact entry
function createNewContact(phoneNumber, email, linkPrecedence, linkedId=null){
    let curDate = new Date().toISOString()
    let command = `
        INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
        VALUES ("${phoneNumber}", "${email}", ${linkedId}, "${linkPrecedence}", "${curDate}", "${curDate}")
    `

    db.exec(command, (err) => {
        if(err){
            throw err;
        }

        console.log(`Inserted new ${linkPrecedence} contact!`);
    })
}


function getAllContacts(callback=()=>{}){
    let command = `
        SELECT * FROM Contact
    `

    db.all(command, [], (err, rows) => {
        if(err){
            throw err;
        }

        rows.forEach((row, i) => {
            console.log(row)
        })

        callback(rows)
    })
}

// Update 

function clearTable(){
    let command = `
        DELETE FROM Contact
    `

    db.exec(command, (err) => {
        if(err){
            throw err;
        }

        console.log(`Cleared table Contact!`);
    })
}