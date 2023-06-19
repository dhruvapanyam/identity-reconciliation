const sqlite3 = require('sqlite3').verbose();

// Connect to the `contacts.db` database if exists. If not, create the db file...
const db = new sqlite3.Database('./databases/contacts.db', (err) => {
    if(err){
        throw err;
    }
    
    console.log(`Connected to the CONTACTS database!`);

    // createTable();
    // getAllContacts()
    // clearTable();

    // handleCheckoutInformation("4","E");


})


// Relevant SQL basic functions
// ------------------------------------------------------

async function runQuery(command){
    console.log(command)
    let response = await new Promise((resolve, reject) => {
        db.all(command, (err, rows) => {
            if(err){reject(err);}
            resolve(rows);
        })
    })
    return response;
}

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
async function createNewContact(phoneNumber, email, linkPrecedence, linkedId=null){
    let curDate = new Date().toISOString()
    let command = `
        INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
        VALUES ("${phoneNumber}", "${email}", ${linkedId}, "${linkPrecedence}", "${curDate}", "${curDate}")
    `

    await new Promise((resolve, reject) => {
        db.exec(command, (err) => {
            if(err){
                reject(err);
            }

            console.log(`Inserted new ${linkPrecedence} contact!`);
            resolve()
        })
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
async function getContactData(id, callback){
    let data = await new Promise((resolve, reject) => {
        db.get(`SELECT * FROM Contact WHERE id=${id}`, [], (err,data) => {
            if(err){reject(err);}
            // console.log(`fetched data for id ${id}`)
            resolve(data);
        })
    })

    return data;
}

// given an id number, find its super-parent (climb up the linkedId ladder until we reach a primary contact)
async function getSuperParent(id, callback){
    
    let contactData = await getContactData(id);
    while(true){
        let data = contactData;
        if(data == undefined) throw `No data found...!`
        
        let lId = data?.linkedId;
        let lP = data?.linkPrecedence;

        if(lP == "primary"){
            // found super-parent of id
            return data;
        }

        if(lP == "secondary" && lId == null) throw `Inconsistent link data!`

        contactData = await getContactData(lId); // if secondary contact, get contact data using the linkedId value
    }
    
}

async function convertPrimaryToSecondary(id, lId){
    let curTime = new Date().toISOString();
    let command = `
        UPDATE Contact
        SET linkPrecedence = "secondary",
            linkedId = ${lId},
            updatedAt = "${curTime}"
        WHERE id = ${id}
    `

    await new Promise((resolve, reject) => {
        db.exec(command, (err) => {
            if(err){reject(err);}
            resolve();
        })
    })
    return;
}

// given a contact id, find all contacts in its branch
async function expandBranch(id){
    let command = `
        SELECT id, phoneNumber, email, linkedId FROM Contact
        WHERE linkedId = ${id}
    `

    console.log('expanding',id)
    let subContacts = await new Promise((resolve, reject) => {
        db.all(command, [], (err, rows) => {
            if(err){reject(err);}
            resolve(rows);
        })
    })

    let res = [...subContacts];

    for(let i=0; i<subContacts.length; i++){
        let subChildren = await expandBranch(subContacts[i].id);
        res.push(...subChildren);
    }


    return res;


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

    let superPrimaryContact;

    if(phoneBranchNodeId == undefined || emailBranchNodeId == undefined){
        // new contact information has been obtained
        console.log('new contact reqd')
        if(phoneBranchNodeId == undefined && emailBranchNodeId == undefined){
            // create a new primary contact
            console.log('new prim')
            await createNewContact(phoneNumber, email, "primary")
            console.log('getting superparent')
            superPrimaryContact = (await runQuery(`SELECT * FROM Contact WHERE phoneNumber=${phoneNumber}`))[0]
        }
        else if(phoneBranchNodeId != undefined){
            console.log('new sec')
            // create a new contact that links to the contact with id=phoneBranchNodeId
            await createNewContact(phoneNumber, email, "secondary", phoneBranchNodeId);
            superPrimaryContact = await getSuperParent(phoneBranchNodeId);
        }
        else{
            console.log('new sec')
            await createNewContact(phoneNumber, email, "secondary", emailBranchNodeId);
            superPrimaryContact = await getSuperParent(emailBranchNodeId);
        }
    }

    else{
        // find super-parents of phone and email branches
        // if they are not the same, then merge the newer one into the older one

        console.log('both exist')

        let phoneBranchRoot = await getSuperParent(phoneBranchNodeId);
        let emailBranchRoot = await getSuperParent(emailBranchNodeId);


        if(phoneBranchRoot.id == emailBranchRoot.id){
            // both branches came from the same root
            // no further action required
        }
        else if(phoneBranchRoot.id < emailBranchRoot.id){
            // update emailRoot to have linkedId = phoneRoot
            await convertPrimaryToSecondary(emailBranchRoot.id, phoneBranchRoot.id);
        }
        else{
            // update phoneRoot to have linkedId = emailRoot
            await convertPrimaryToSecondary(phoneBranchRoot.id, emailBranchRoot.id);
        }


        superPrimaryContact = phoneBranchRoot.id < emailBranchRoot.id ? phoneBranchRoot : emailBranchRoot

    }

    console.log('Expanding from super root:',superPrimaryContact)



    let res = [superPrimaryContact];
    res.push(...await expandBranch(superPrimaryContact.id))

    console.log(res)


}