const express = require('express');
const { fetchLanguage, createLanguage } = require('../controller/Language');

const router = express.Router();

router.get('/',fetchLanguage).post('/',createLanguage);

exports.router = router;