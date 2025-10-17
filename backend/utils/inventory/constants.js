// Shared inventory validation constants used by validation

const INVENTORY_ID_REGEX = /^I-(\d{5})$/;
const USER_ID_REGEX = /^U-\d{5}$/;

const INGREDIENT_NAME_REGEX = /^[a-zA-Z\s\-]+$/;
const INGREDIENT_MIN_LENGTH = 2;
const INGREDIENT_MAX_LENGTH = 50;

const MIN_QUANTITY = 0.01;
const MAX_QUANTITY = 9999;


const ALLOWED_UNITS = [
  'pieces', 'kg', 'g', 'liters', 'ml', 'cups', 'tbsp', 'tsp', 'dozen'
];

const ALLOWED_CATEGORIES = [
  'Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Frozen', 'Canned', 'Other'
];

const ALLOWED_LOCATIONS = [
  'Fridge', 'Freezer', 'Pantry', 'Counter', 'Cupboard'
];

const COST_DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/;
const MIN_COST = 0.01;
const MAX_COST = 999.99;


// inventory alerts constants
// show items expiring within this many days
const EXPIRY_DAYS = 2; 
// threshold below which an item is considered low stock
const LOW_STOCK_THRESHOLD = 3;
// additional units to suggest ordering beyond just reaching threshold
const SUGGESTED_ORDER_ADD_ON = 5; 

module.exports = {
    INVENTORY_ID_REGEX,
    USER_ID_REGEX,
    INGREDIENT_NAME_REGEX,
    INGREDIENT_MIN_LENGTH,
    INGREDIENT_MAX_LENGTH,
    MIN_QUANTITY,
    MAX_QUANTITY,
    ALLOWED_UNITS,
    ALLOWED_CATEGORIES,
    ALLOWED_LOCATIONS,
    COST_DECIMAL_REGEX,
    MIN_COST,
    MAX_COST,
    EXPIRY_DAYS,
    LOW_STOCK_THRESHOLD,
    SUGGESTED_ORDER_ADD_ON
};
