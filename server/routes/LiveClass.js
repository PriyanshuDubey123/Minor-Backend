const express = require('express');
const { shareLiveClassUrl, deleteLiveClassUrl, getLiveClasses } = require('../controller/LiveClass');

const router = express.Router();

router.get('/getliveclasses',getLiveClasses)
router.post('/share',shareLiveClassUrl)
router.delete('/delete',deleteLiveClassUrl)

module.exports = router;