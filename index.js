const {handleCheckoutInformation, clearTable} = require('./db_handling');

const app = require('express')();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = 8080 || process.env.PORT

app.get('/', (req, res) => {
    return res.json([1,2,3])
})

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

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`)
})

