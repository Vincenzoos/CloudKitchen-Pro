const { validateAndParseRecipeData } = require('../utils/recipe/recipeValidation');
const { validateAndParseInventoryData } = require('../utils/inventory/inventoryValidation');
const { validateAndParseUserData } = require('../utils/user/userValidation');
const User = require('../models/User');

// Recipe validation middleware
function recipeValidationMiddleware(req, res, next) {
    // Using server-side validation rules set up earlier (to avoid duplication and ensure consistency with model-level validation)
    const result = validateAndParseRecipeData(req.body);
    // Debug to check if middleware layer is working or not
    console.log("Validated Recipe Data:", result);
    // Attach parsed/validated data to req for use in the route handler
    // If there are errors, attach them to req.validationErrors and let the route decide how to render
    req.validatedRecipe = result;
    if (result.errors.length > 0) {
        req.validationErrors = result.errors;
    }
    next();
}

// Inventory validation middleware
function inventoryValidationMiddleware(req, res, next) {
    // Using server-side validation rules set up earlier (to avoid duplication and ensure consistency with model-level validation)
    const result = validateAndParseInventoryData(req.body);
    // Debug to check if middleware layer is working or not
    console.log("Validated Inventory Data:", result);
    // Attach parsed/validated data to req for use in the route handler
    req.validatedInventory = result;
    if (result.errors.length > 0) {
        req.validationErrors = result.errors;
    }
    next();
}

// User validation middleware
function userValidationMiddleware(req, res, next) {
    // Using server-side validation rules set up earlier (to avoid duplication and ensure consistency with model-level validation)
    const result = validateAndParseUserData(req.body);
    // Debug to check if middleware layer is working or not
    console.log("Validated User Data:", result);
    // Attach validated result; if errors, attach to req.validationErrors and let route render
    req.validatedUser = result;
    if (result.errors.length > 0) {
        req.validationErrors = result.errors;
    }
    next();
}



module.exports = { recipeValidationMiddleware, inventoryValidationMiddleware, userValidationMiddleware };