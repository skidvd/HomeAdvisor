const express = require('express');
const router = express.Router({mergeParams: true});

router.use((req, resp, next) => {
    resp.status(404).send(`<h1>${req.method} ${req.path} is not a supported endpoint!</h1>`);
});

module.exports = router;
