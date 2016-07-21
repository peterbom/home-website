module.exports.handleError = err => {
    console.trace(err);
    process.exit(1);
};