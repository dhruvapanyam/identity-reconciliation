const {handleCheckoutInformation, clearTable} = require('./db_handling');

const app = require('express')();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT =  process.env.PORT || 8080

app.post('/identify', (req, res) => {
    let email = req.body.email;
    let phoneNumber = req.body.phoneNumber;

    // console.log(email, phoneNumber);

    handleCheckoutInformation(phoneNumber, email)
    .then(data => {
        // console.log(data)
        return res.json(data);
    })
})

app.post('/clear', (req, res) => {
    clearTable();
    return res.json();
})

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening on port ${PORT}...`)
})

