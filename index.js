const sqlite3 = require('sqlite3').verbose();

// Connect to the `contacts.db` database if exists. If not, create the db file...
const db = new sqlite3.Database('./databases/contacts.db', (err) => {
    if(err){
        throw err;
    }
    
    console.log(`Connected to the CONTACTS database!`);

    // createTable();
    // createNewContact("1", "A", "primary");
    // createNewContact("3", "A", "secondary", 1);
    // createNewContact("1", "C", "secondary", 1);
    // createNewContact("4", "C", "secondary", 3);
    // createNewContact("2", "B", "primary");
    // getAllContacts()
    // clearTable();

    handleCheckoutInformation("2", "D");

    // getSuperParent(4, id=>{
    //     console.log('super parent = ',id)
    // })

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




// MAIN logic
// ---------------

// get row data given a contact id
function getContactData(id, callback){
    db.get(`SELECT * FROM Contact WHERE id=${id}`, [], (err,data) => {
        if(err){throw err;}
        // console.log(`fetched data for id ${id}`)
        callback(data);
    })
}

// given an id number, find its super-parent (climb up the linkedId ladder until we reach a primary contact)
function getSuperParent(id, callback){
    
    const handleContactData = (data) => {   // callback function once we get the contact data from the db
        if(data == undefined) throw `No data found...!`
        
        let lId = data?.linkedId;
        let lP = data?.linkPrecedence;

        if(lP == "primary"){
            // found super-parent of id
            callback(data.id); // callback function from the request of "getSupeParent()"
            return;
        }

        if(lP == "secondary" && lId == null) throw `Inconsistent link data!`

        getContactData(lId, handleContactData); // if secondary contact, get contact data using the linkedId value
    }

    getContactData(id, handleContactData);
    
}

// given checkout info from /identify endpoint, consolidate all relevant information
async function handleCheckoutInformation(phoneNumber, email){
    // check if either phoneNumber or email is a new value

    // we identify 2 branches if existing:
    //      1. phoneBranch -> heirarchy of contacts with a common phoneNumber with the query
    //      2. emailBranch -> heirarchy of contacts with a common email with the query
    // to find the branch, we only need to find any row with a common value with the query


    // find first entry where email = email
    let commandEmail = `
        SELECT id FROM Contact
        WHERE email = '${email}'
        LIMIT 1
    `

    // find first entry where phoneNumber = phoneNumber
    let commandPhone = `
        SELECT id FROM Contact
        WHERE phoneNumber = '${phoneNumber}'
        LIMIT 1
    `

    // async-await used to determine existence of rows before continuing

    let phoneBranchNodeId = await new Promise((resolve, reject) => {
        db.get(commandPhone, [], (err, data) => {
            if(err){
                reject(err);
            }
            resolve(data?.id); // returns the id of the row required if exists, else undefined
        })
    })

    let emailBranchNodeId = await new Promise((resolve, reject) => {
        db.get(commandEmail, [], (err, data) => {
            if(err){
                reject(err);
            }
            resolve(data?.id);
        })
    })


    if(phoneBranchNodeId == undefined || emailBranchNodeId == undefined){
        // new contact information has been obtained
    }

    else{
        // find super-parents of phone and email branches
        // if they are not the same, then merge the newer one into the older one
    }


}