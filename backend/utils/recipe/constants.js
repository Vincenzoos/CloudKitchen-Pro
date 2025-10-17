const RECIPE_ID_REGEX = /^R-(\d{5})$/;
const TITLE_MIN_LENGTH = 3;
const TITLE_MAX_LENGTH = 100;

const USER_ID_REGEX = /^U-\d{5}$/;

const CHEF_NAME_REGEX = /^[a-zA-Z\s\-']+$/;
const CHEF_NAME_MIN_LENGTH = 2;
const CHEF_NAME_MAX_LENGTH = 50;

const INGREDIENT_REGEX = /^([A-Za-z]+(\s+[A-Za-z]+)*|\d+[A-Za-z]*\s+[A-Za-z]+(\s+[A-Za-z]+)*)$/;
const MIN_INGREDIENT_COUNT = 1;
const MAX_INGREDIENT_COUNT = 20;
const MIN_INGREDIENT_LENGTH = 3;

const INSTRUCTION_MIN_LENGTH = 10;
const MIN_INSTRUCTION_COUNT = 1;
const MAX_INSTRUCTION_COUNT = 15;

const PREP_TIME_MIN = 1;
const PREP_TIME_MAX = 480;

const SERVINGS_MIN = 1;
const SERVINGS_MAX = 20;

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const CUISINE_TYPES = ['Italian', 'Asian', 'Mexican', 'American', 'French', 'Indian', 'Mediterranean', 'Other'];
const DIFFICULTY_TYPES = ['Easy', 'Medium', 'Hard'];

module.exports = {
    RECIPE_ID_REGEX,
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    USER_ID_REGEX,
    CHEF_NAME_REGEX,
    CHEF_NAME_MIN_LENGTH,
    CHEF_NAME_MAX_LENGTH,
    INGREDIENT_REGEX,
    MIN_INGREDIENT_COUNT,
    MAX_INGREDIENT_COUNT,
    MIN_INGREDIENT_LENGTH,
    INSTRUCTION_MIN_LENGTH,
    MIN_INSTRUCTION_COUNT,
    MAX_INSTRUCTION_COUNT,
    PREP_TIME_MIN,
    PREP_TIME_MAX,
    SERVINGS_MIN,
    SERVINGS_MAX,
    MEAL_TYPES,
    CUISINE_TYPES,
    DIFFICULTY_TYPES
};
