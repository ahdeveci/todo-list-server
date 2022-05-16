var jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
    let token = req.header('Authorization');
    if (req.url === '/login' || req.url === '/register') {
        next();
    } else if (!token || token === undefined) {
        res.json({status: false, message: "Token bulunmamaktadır.", code: 401});
    } else {
        const nToken = token.split(' ')[1];
        jwt.verify(nToken, req.app.get("api_secret_key"), (error, decoded) => {
            if (error) {
                res.status(403).send(false);
            } else {
                req.user = decoded;
                next();
            }
        });
    }
}