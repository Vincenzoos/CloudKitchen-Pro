const { 
    INGREDIENT_MIN_LENGTH, 
    INGREDIENT_MAX_LENGTH, 
    INGREDIENT_NAME_REGEX,
    MIN_QUANTITY, 
    MAX_QUANTITY, 
    ALLOWED_UNITS,
    ALLOWED_CATEGORIES,
    ALLOWED_LOCATIONS,
    COST_DECIMAL_REGEX,
    MIN_COST,
    MAX_COST
} = require('./constants');

function validateAndParseInventoryData(body) {
    let {
        ingredientName,
        quantity,
        'unit-measurement': unitMeasurement,
        category,
        'purchase-date': purchaseDate,
        'expiration-date': expirationDate,
        location,
        'purchase-cost': purchaseCost
    } = body;

    const errors = [];

    // Ingredient Name - trim and validate
    ingredientName = ingredientName ? ingredientName.trim() : "";
    if (!ingredientName) {
        errors.push("Ingredient name is required.");
    } else if (ingredientName.length < INGREDIENT_MIN_LENGTH || ingredientName.length > INGREDIENT_MAX_LENGTH) {
        errors.push(`Ingredient name must be between ${INGREDIENT_MIN_LENGTH} and ${INGREDIENT_MAX_LENGTH} characters.`);
    } else if (!INGREDIENT_NAME_REGEX.test(ingredientName)) {
        errors.push("Ingredient name can only contain letters, spaces, and hyphens.");
    }

    // Quantity - model allows decimal values, enforce numeric range
    quantity = quantity ? quantity.toString().trim() : "";
    const quantityNum = parseFloat(quantity);
    if (!quantity || isNaN(quantityNum)) {
        errors.push("Quantity is required and must be a number.");
    } else if (quantityNum < MIN_QUANTITY || quantityNum > MAX_QUANTITY) {
        errors.push(`Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`);
    }

    // Unit of Measurement
    if (!unitMeasurement || !ALLOWED_UNITS.includes(unitMeasurement)) {
        errors.push("Please select a valid unit of measurement.");
    }

    // Category
    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
        errors.push("Please select a valid food category.");
    }

    // Purchase Date
    if (!purchaseDate) {
        errors.push("Purchase date is required.");
    } else if (isNaN(Date.parse(purchaseDate))) {
        errors.push("Purchase date must be a valid date.");
    } else if (new Date(purchaseDate) > new Date()) {
        errors.push("Purchase date cannot be in the future.");
    }

    // Expiration Date
    if (!expirationDate) {
        errors.push("Expiration date is required.");
    } else if (isNaN(Date.parse(expirationDate))) {
        errors.push("Expiration date must be a valid date.");
    } else if (purchaseDate && !isNaN(Date.parse(purchaseDate)) && new Date(expirationDate) <= new Date(purchaseDate)) {
        errors.push("Expiration date must be after purchase date.");
    }

    // Location
    if (!location || !ALLOWED_LOCATIONS.includes(location)) {
        errors.push("Please select a valid storage location.");
    }

    // Purchase Cost - enforce numeric range and 2 decimal places max
    purchaseCost = purchaseCost ? purchaseCost.toString().trim() : "";
    const costNum = parseFloat(purchaseCost);
    if (!purchaseCost || isNaN(costNum)) {
        errors.push("Purchase cost is required and must be a number.");
    } else if (costNum < MIN_COST || costNum > MAX_COST) {
        errors.push(`Purchase cost must be between ${MIN_COST} and ${MAX_COST}.`);
    } else if (!COST_DECIMAL_REGEX.test(purchaseCost)) {
        errors.push("Purchase cost must have at most 2 decimal places.");
    }

    return {
        errors,
        ingredientName,
        quantity: quantityNum,
        unitMeasurement,
        category,
        // Mongoose model expects Date objects not date strings
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        location,
        purchaseCost: costNum
    };
}

module.exports = { validateAndParseInventoryData };