function isNumber(n){
     return typeof n === 'number' && !isNaN(n) && isFinite(n);
}

function isValidDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
}

function isValidDateFormat(dateString){
    // Basic validation for date format (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

module.exports = { isNumber, isValidDate, isValidDateFormat, daysBetween };