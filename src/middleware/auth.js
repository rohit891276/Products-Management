const jwt = require('jsonwebtoken');

const authentication = async function (req, res, next) {
    try {

        let token = req.headers["Authorization"] || req.headers["authorization"];

        if (!token) return res.status(401).send({ status: false, message: "Missing authentication token in request" });

        let Bearer = token.split(' ');

        jwt.verify(Bearer[1], "Project5-group16", (err, decoded) => {
            if (err) {
                return res.status(401).send({ status: false, message: err.message })
            } else {
                req.decodedToken = decoded
                next();
            }
        })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};


module.exports = { authentication };
