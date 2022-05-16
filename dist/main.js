const express = require('express');
const app = express();
app.get('/', (req, res) => {
    console.info('here=>');
    res.send("Hello World");
});
app.listen(3000);
//# sourceMappingURL=main.js.map