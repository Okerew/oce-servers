// This server is used for encrypthing and decrypting the already encrypted config on the client side adding a second layer of defense.
const express = require('express');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const cors = require("cors");
require('dotenv').config(); 

const app = express();

const allowedOrigins = ['https://okraleditor.glitch.me', 'https://hill-dazzling-number.glitch.me'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

app.use(cors(corsOptions))
app.use(bodyParser.json());

const serverKey = process.env.SERVER_KEY;

app.post('/encrypt', (req, res) => {
  const { config } = req.body;
  const encryptedConfig = CryptoJS.AES.encrypt(config, serverKey).toString();
  res.json({ encryptedConfig });
});

app.post('/decrypt', (req, res) => {
  const { encryptedConfig } = req.body;
  const decryptedConfig = CryptoJS.AES.decrypt(encryptedConfig, serverKey).toString(CryptoJS.enc.Utf8);
  res.json({ config: decryptedConfig });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
