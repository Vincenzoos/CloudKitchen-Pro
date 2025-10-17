const express = require('express');
const { requireLogin, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

const STUDENT_ID = '33810672';
const STUDENT_NAME = 'Viet Tran';
const Recipe = require('../models/Recipe');
const Inventory = require('../models/UserInventory');

// apply login + role-check to all report routes, make sure only user with the role of "admin" can access
router.use(requireLogin, authorizeRoles(['admin']));

// Reports page
router.get(`/analytics-${STUDENT_ID}`, async (req, res) => {
  try {
    const TOP_N_CHEFS = 5;
    const TOP_N_INGREDIENTS = 10;
    const TOP_N_RECIPES = 10;
    

    // Total number of recipes
    const totalRecipes = await Recipe.countDocuments();
    
    // Merge multiple analytics into a single aggregation using $facet
    const facets = await Recipe.aggregate([
      { $facet: {
        // summary: total count, avg prep, avg servings, and distinct cuisine types
        summary: [
          { $group: { _id: null, total: { $sum: 1 }, avgPrep: { $avg: "$prepTime" }, avgServ: { $avg: "$servings" } } },
          { $project: { _id: 0, total: "$total", avgPrep: { $round: ["$avgPrep", 0] }, avgServ: { $round: ["$avgServ", 0] } } }
        ],

        // cuisineDistribution: count and avg prep per cuisine, group by cuisineType
        cuisineDistribution: [
          { $group: { _id: "$cuisineType", count: { $sum: 1 }, avgPrep: { $avg: "$prepTime" } } },
          { $project: { _id: 0, cuisine: "$_id", count: 1, avgPrep: { $round: ["$avgPrep", 0] } } },
          // sort by number of recipes desc
          { $sort: { count: -1 } },
          // percentage of total recipes by cuisine (count / totalRecipes * 100)
          { $addFields: { pct: { $round: [ { $multiply: [ { $divide: ["$count", (totalRecipes || 1)] }, 100 ] }, 0 ] } } }
        ],

        // difficultyAnalysis: counts and averages per difficulty, group by difficulty
        difficultyAnalysis: [
          { $group: { _id: "$difficulty", count: { $sum: 1 }, avgPrep: { $avg: "$prepTime" }, avgServ: { $avg: "$servings" } } },
          { $project: { _id: 0, difficulty: "$_id", count: 1, avgPrep: { $round: ["$avgPrep", 0] }, avgServ: { $round: ["$avgServ", 0] } } },
          // sort by number of recipes desc
          { $sort: { count: -1 } },
          // percentage of total recipes by difficulty (count / totalRecipes * 100)
          { $addFields: { pct: { $round: [ { $multiply: [ { $divide: ["$count", (totalRecipes || 1)] }, 100 ] }, 0 ] } } }
        ],

        // chefSummary: top 5 chefs with recipe counts and top 3 cuisines from their recipes
  chefSummary: [
          // first compute recipe counts and sum prep time per (recipe chef, cuisine)
          { $group: { _id: { chef: "$chef", cuisine: "$cuisineType" }, count: { $sum: 1 }, sumPrep: { $sum: "$prepTime" } } },
          // group by chef: collect cuisines and total recipe count per cuisine as array of cuisines, total recipes for each chef, total prep time for all their recipes
          { $group: { _id: "$_id.chef", cuisines: { $push: { cuisine: "$_id.cuisine", count: "$count" } }, totalRecipes: { $sum: "$count" }, totalPrep: { $sum: "$sumPrep" } } },
          // unwind cuisines so we can sort them by count, sort by cuisine count desc
          { $unwind: "$cuisines" },
          { $sort: { "_id": 1, "cuisines.count": -1 } },
          // regroup to collect cuisines in sorted order
          { $group: { _id: "$_id", totalRecipes: { $first: "$totalRecipes" }, cuisines: { $push: "$cuisines" }, avgPrepTime: { $first: "$avgPrepTime" }, totalPrep: { $first: "$totalPrep" } } },
          // project chef object and take top 3 cuisines (map to cuisine names)
          { $project: { _id: 0, chef: "$_id", recipes: "$totalRecipes", 
            // compute average prep time across all their recipes (totalPrep / totalRecipes)
            avgPrepTime: { $round: [
                { $cond: [
                  { $gt: ["$totalRecipes", 0] },
                  { $divide: ["$totalPrep", "$totalRecipes"] },
                  0
                ] }, 0 ] }, 
            cuisines: { $map: { input: { $slice: ["$cuisines", 3] }, as: "c", in: "$$c.cuisine" } } } },
          // sort chefs by recipe count desc and limit to top 5
          { $sort: { recipes: -1 } },
          { $limit: TOP_N_CHEFS }
        ]
        ,
        // popularRecipes: most created / frequent recipe titles
        popularRecipes: [
          // normalize title for grouping: trim + lowercase
          { $project: { titleNorm: { $toLower: { $trim: { input: "$title" } } }, prepTime: 1 } },
          { $group: { _id: "$titleNorm", count: { $sum: 1 }, avgPrep: { $avg: "$prepTime" } } },
          { $project: { _id: 0, title: "$_id", count: 1, avgPrep: { $round: ["$avgPrep", 0] } } },
          { $sort: { count: -1 } },
          { $limit: TOP_N_RECIPES }
        ],

        // ingredientUsage: unwind recipe.ingredients and count occurrences
        ingredientUsage: [
          { $unwind: { path: "$ingredients", preserveNullAndEmptyArrays: false } },
          { $project: { ingredient: { $trim: { input: { $toLower: "$ingredients" } } } } },
          { $group: { _id: "$ingredient", count: { $sum: 1 } } },
          { $project: { _id: 0, ingredient: "$_id", count: 1 } },
          { $sort: { count: -1 } },
          { $limit: TOP_N_INGREDIENTS }
        ],

        // seasonalTrends: recipes per year/month and cuisine
        seasonalTrends: [
          { $project: { year: { $year: "$createdDate" }, month: { $month: "$createdDate" }, cuisine: "$cuisineType" } },
          { $group: { _id: { year: "$year", month: "$month", cuisine: "$cuisine" }, count: { $sum: 1 } } },
          { $project: { _id: 0, year: "$_id.year", month: "$_id.month", cuisine: "$_id.cuisine", count: 1 } },
          { $sort: { year: -1, month: -1 } }
        ],

        // costReports: improved estimated cost by matching inventory items whose ingredientName
        // appears (case-insensitive substring) in any recipe ingredient string (e.g. "100g eggs" -> "eggs")
        costReports: [
          { $project: { title: 1, ingredients: 1 } },
          { $lookup: {
              from: "inventories",
              let: { recipeIngredients: "$ingredients" },
              pipeline: [
                // keep inventory items where any recipe ingredient string contains the inventory.ingredientName
                { $match: {
                  $expr: {
                    $anyElementTrue: {
                      $map: {
                        input: "$$recipeIngredients",
                        as: "ing",
                        in: { $gt: [ { $indexOfCP: [ { $toLower: "$$ing" }, { $toLower: "$ingredientName" } ] }, -1 ] }
                      }
                    }
                  }
                } },
                { $project: { ingredientName: 1, cost: 1 } }
              ],
              as: "matchedInventory"
          } },
          // sum up all matched inventory item costs (cost per unit) as estimatedCost, round to 2 decimal places
          { $addFields: { estimatedCost: { $round: [ { $sum: { $map: { input: "$matchedInventory", as: "m", in: { $ifNull: ["$$m.cost", 0] } } } }, 2 ] } } },
          { $project: { _id: 0, title: 1, estimatedCost: 1 } },
          { $sort: { estimatedCost: -1 } },
          { $limit: 25 }
        ]
      } }
    ]);

    // facets[0] contains the result object with keys summary, cuisineDistribution, difficultyAnalysis, chefProductivity, chefCuisines
    const facetResult = (facets && facets.length) ? facets[0] : {};

    // assemble summary fields
    const summary = {
      totalRecipes,
      avgPrepTime: (facetResult.summary && facetResult.summary.length) ? facetResult.summary[0].avgPrep : null,
      avgServings: (facetResult.summary && facetResult.summary.length) ? facetResult.summary[0].avgServ : null,
      cuisineTypes: (facetResult.cuisineDistribution || []).map(c => c.cuisine)
    }

    // topChefs produced directly by the aggregation (chefSummary)
    const topChefs = facetResult.chefSummary || [];

    const cuisineDistribution = facetResult.cuisineDistribution || [];
    const difficultyAnalysis = facetResult.difficultyAnalysis || [];
    const popularRecipes = facetResult.popularRecipes || [];
    const ingredientUsage = facetResult.ingredientUsage || [];
    const seasonalTrends = facetResult.seasonalTrends || [];
    const costReports = facetResult.costReports || [];

  // recommendation pipeline using setIntersection (fast, exact token match)
  const recommendations = await Recipe.aggregate([
            // Lookup inventory items documents
            // each recipe will have an "inventory" array of all inventory items
            // e.g. recipe.inventory = [ { ingredientName: 'eggs' }, { ingredientName: 'milk' }, ... ]
            { $lookup: {
                from: 'inventories',
                let: { ingredients: '$ingredients' },
                pipeline: [
                { $project: { ingredientName: 1 } }
                ],
                as: 'inventory'
            } },
            // Create an array of lowercased inventory ingredient names for easier matching
            // e.g. recipe.inventoryNames = [ 'eggs', 'milk', ... ]
            { $addFields: {
                inventoryNames: {
                    $map: {
                        input: '$inventory',
                        as: 'inv',
                        in: { $toLower: '$$inv.ingredientName' }
                    }
                }
            } },
            // Available ingredients array, used for calculating availability percentage
            { $addFields: {
                available: {
                    $filter: {
                        input: '$ingredients',
                        as: 'ing',
                        cond: {
                            $anyElementTrue: {
                                $map: {
                                    input: '$inventoryNames',
                                    as: 'inv',
                                    in: { $gt: [ { $indexOfCP: [ { $toLower: '$$ing' }, '$$inv' ] }, -1 ] }
                                }
                            }
                        }
                    }
                },
            } },
            // Calculate percentage of available ingredients (available / total * 100)
            { $addFields: {
                percent: {
                    $floor: {
                        $multiply: [ { $divide: [ { $size: '$available' }, { $size: '$ingredients' } ] }, 100 ]
                    }
                }
            } },
            // Determine availability status based on percentage
            { $addFields: {
                status: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$percent', 100] }, then: 'Ready to Cook!' },
                            { case: { $gte: ['$percent', 60] }, then: 'Mostly Available' },
                            { case: { $gte: ['$percent', 30] }, then: 'Partially Available' },
                        ],
                        default: 'Not Available'
                    }
                }
            } },
            { $project: { recipe: '$$ROOT', available: 1, missing: 1, percent: 1, status: 1 } },
            // Only suggest recipes that are fully available (100% of ingredients)
            { $match: { percent: 100 } },
            { $sort: { 'recipe.createdDate': -1 } }
        ]);


    res.render('reports/reports', {
      title: 'Reports - CloudKitchen Pro',
      isLoggedIn: true,
      user: req.user,
      STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
      STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
      analytics: {
        summary,
        cuisineDistribution,
        difficultyAnalysis,
        topChefs,
        popularRecipes,
        ingredientUsage,
        seasonalTrends,
        costReports,
        recommendations
      },
      TOP_N_CHEFS,
      TOP_N_INGREDIENTS,
      TOP_N_RECIPES
    });
  } catch (err) {
    console.error('Failed to build reports analytics', err);
    res.render('reports/reports', {
      title: 'Reports - CloudKitchen Pro',
      isLoggedIn: true,
      user: req.user,
      STUDENT_ID: req.app.locals.STUDENT_ID || STUDENT_ID,
      STUDENT_NAME: req.app.locals.STUDENT_NAME || STUDENT_NAME,
      analytics: { error: 'Failed to compute analytics' }
    });
  }
});

module.exports = router;
