module.exports = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
            next();
        } catch(err) {
            err = err === undefined ? 'Unknown error occurred' : err;
            next(err);
        }
    };
};
